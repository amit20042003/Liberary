import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    BookOpen, Users, DollarSign, AlertTriangle, Plus, X, Search, Armchair, User,
    Phone, Image as ImageIcon, Settings, LogOut, CheckCircle, Edit, Trash2, Eye, History, BookMarked, Loader2
} from 'lucide-react';
import { supabase } from './supabaseClient';
import Auth from './Auth';

// --- INITIAL STATE (Starts Empty) ---
const initialState = {
    students: [],
    feeStructure: { 'Full-time': 1200, 'Half-time': 600 },
    seats: Array.from({ length: 50 }, (_, i) => {
        const num = i + 1;
        let gender = (num >= 1 && num <= 15) ? 'girl' : 'boy';
        return { number: num, gender, occupiedBy: null };
    }),
};

// Helper function to get today's date with time zeroed out for reliable comparison
const getTodayDate = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
};


// --- MAIN APP COMPONENT ---
const App = () => {
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false); // For modal actions
    const [session, setSession] = useState(null);
    const [activeView, setActiveView] = useState('dashboard');
    const [students, setStudents] = useState(initialState.students);
    const [feeStructure, setFeeStructure] = useState(initialState.feeStructure);
    const [seats, setSeats] = useState(initialState.seats);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalContent, setModalContent] = useState({ type: '', item: null });
    const [dashboardProfile, setDashboardProfile] = useState(null);

    const fetchStudents = useCallback(async () => {
        if (!session) return;
        try {
            const { data, error } = await supabase
                .from('students')
                .select('*')
                .eq('user_id', session.user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setStudents(data || []);
        } catch (error) {
            console.error("Error fetching students:", error.message);
            alert(`Error fetching students: ${error.message}`);
        }
    }, [session]);

    useEffect(() => {
        setLoading(true);
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setLoading(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });

        return () => subscription.unsubscribe();
    }, []);

    useEffect(() => {
        if (session) {
            fetchStudents();
        }
    }, [session, fetchStudents]);
    
    useEffect(() => {
        setSeats(prevSeats => 
            prevSeats.map(seat => {
                const occupyingStudent = students.find(s => s.status === 'active' && s.seat_number === seat.number);
                return { ...seat, occupiedBy: occupyingStudent ? occupyingStudent.student_id : null };
            })
        );
    }, [students]);
    
    const activeStudents = useMemo(() => students.filter(s => s.status === 'active'), [students]);
    const departedStudents = useMemo(() => students.filter(s => s.status === 'departed'), [students]);

    const dashboardStats = useMemo(() => {
        const today = getTodayDate();
        const feesPending = activeStudents.filter(s => new Date(s.next_due_date) < today);
        return {
            totalStudents: activeStudents.length,
            seatsOccupied: activeStudents.length,
            feesPendingList: feesPending,
            totalFeesPending: feesPending.reduce((acc, s) => acc + (s.fee_amount || 0), 0),
        };
    }, [activeStudents]);

    const handleOpenModal = useCallback((type, item = null) => {
        setModalContent({ type, item });
        setIsModalOpen(true);
    }, []);

    const handleCloseModal = () => {
        if(isSubmitting) return; // Prevent closing while an operation is in progress
        setIsModalOpen(false);
    }

    const runAction = async (action) => {
        setIsSubmitting(true);
        try {
            await action();
        } catch (error) {
            alert(`Operation failed: ${error.message}`);
            console.error("Operation failed:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const addStudent = (studentData, photoFile) => runAction(async () => {
        if (!session) throw new Error("You must be logged in.");
        let photo_url = '';
        if (photoFile) {
            const fileExt = photoFile.name.split('.').pop();
            const fileName = `${session.user.id}/${Date.now()}.${fileExt}`;
            const { error: uploadError } = await supabase.storage.from('student-photos').upload(fileName, photoFile);
            if (uploadError) throw new Error(`Photo Upload Failed: ${uploadError.message}`);
            const { data: { publicUrl } } = supabase.storage.from('student-photos').getPublicUrl(fileName);
            photo_url = publicUrl;
        }
        const { data: maxIdData, error: rpcError } = await supabase.rpc('get_max_student_numeric_id', { p_user_id: session.user.id });
        if (rpcError) throw new Error(`Failed to generate Student ID: ${rpcError.message}`);
        const nextNumericId = (maxIdData || 0) + 1;
        const student_id = `S${nextNumericId.toString().padStart(3, '0')}`;
        const fee_amount = feeStructure[studentData.admissionType];
        
        const admissionDate = new Date(studentData.admissionDate);
        const nextDueDate = new Date(admissionDate.setMonth(admissionDate.getMonth() + 1));

        const newStudent = {
            user_id: session.user.id, student_id, title: studentData.title, name: studentData.name, mobile: studentData.mobile,
            admission_type: studentData.admissionType, seat_number: studentData.seatNumber, photo_url,
            admission_date: studentData.admissionDate, 
            next_due_date: studentData.admissionDate, // Set to admission date so it's due immediately
            fee_amount,
        };
        const { error: insertError } = await supabase.from('students').insert(newStudent);
        if (insertError) throw new Error(`Could not save student: ${insertError.message}`);
        await fetchStudents();
        handleCloseModal();
        alert('Student added successfully!');
    });

    const editStudent = (studentDBId, updatedData) => runAction(async () => {
        const { error } = await supabase.from('students').update(updatedData).eq('id', studentDBId);
        if (error) throw error;
        await fetchStudents();
        handleCloseModal();
        alert('Student updated successfully!');
    });

    const deleteStudent = (student) => runAction(async () => {
        if (student.photo_url) {
            const photoPath = student.photo_url.split('/student-photos/')[1];
            if(photoPath) await supabase.storage.from('student-photos').remove([photoPath]);
        }
        const { error } = await supabase.from('students').delete().eq('id', student.id);
        if (error) throw error;
        await fetchStudents();
        handleCloseModal();
        alert(`${student.name} was deleted successfully.`);
    });
    
    const handleFeePayment = (studentId, paymentDetails) => runAction(async () => {
        const student = students.find(s => s.id === studentId);
        if (!student) throw new Error("Student not found.");
        const newHistory = [...(student.payment_history || []), paymentDetails];
        const nextDueDate = new Date(student.next_due_date);
        nextDueDate.setMonth(nextDueDate.getMonth() + 1);
        const { error } = await supabase.from('students').update({ payment_history: newHistory, next_due_date: nextDueDate.toISOString().split('T')[0] }).eq('id', studentId);
        if (error) throw error;
        await fetchStudents();
        handleCloseModal();
        alert('Payment confirmed!');
    });
    
    // NEW: Function to manually mark a student's fee as due
    const handleMarkAsDue = (studentId) => runAction(async () => {
        const student = students.find(s => s.id === studentId);
        if (!student) throw new Error("Student not found.");

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        const { error } = await supabase
            .from('students')
            .update({ next_due_date: yesterday.toISOString().split('T')[0] })
            .eq('id', studentId);

        if (error) throw error;
        
        await fetchStudents();
        alert(`${student.name}'s fee has been marked as Due.`);
    });
    
    const handleStudentDeparture = (studentDBId, transferTargetDBId) => runAction(async () => {
        const departingStudent = students.find(s => s.id === studentDBId);
        if (!departingStudent) throw new Error("Student not found.");
        
        const today = new Date();
        const nextDueDate = new Date(departingStudent.next_due_date);
        let remainingDays = nextDueDate > today ? Math.ceil((nextDueDate - today) / (1000 * 60 * 60 * 24)) : 0;
        let transferLog = null;
        if (transferTargetDBId) {
            const targetStudent = students.find(s => s.id === transferTargetDBId);
            transferLog = { transferredToId: targetStudent.student_id, transferredToName: targetStudent.name, daysTransferred: remainingDays };
        }
        const { error: departError } = await supabase.from('students').update({ status: 'departed', departure_date: today.toISOString().split('T')[0], transfer_log: transferLog }).eq('id', studentDBId);
        if (departError) throw departError;
        
        if (transferTargetDBId && remainingDays > 0) {
            const targetStudent = students.find(s => s.id === transferTargetDBId);
            const targetDueDate = new Date(targetStudent.next_due_date);
            targetDueDate.setDate(targetDueDate.getDate() + remainingDays);
            const newCreditLog = { fromId: departingStudent.student_id, fromName: departingStudent.name, daysReceived: remainingDays, date: today.toISOString().split('T')[0] };
            const updatedCreditLog = [...(targetStudent.received_credit_log || []), newCreditLog];
            const { error: transferError } = await supabase.from('students').update({ next_due_date: targetDueDate.toISOString().split('T')[0], received_credit_log: updatedCreditLog }).eq('id', transferTargetDBId);
            if (transferError) throw transferError;
        }
        await fetchStudents();
        handleCloseModal();
        alert('Student departure recorded.');
    });

    const handleDashboardSearch = (query) => {
        if (!query) { setDashboardProfile(null); return; }
        const lowerQuery = query.toLowerCase();
        const found = students.find(s => s.name.toLowerCase().includes(lowerQuery) || (s.mobile && s.mobile.includes(lowerQuery)) || s.student_id.toLowerCase() === lowerQuery );
        setDashboardProfile(found || { notFound: true });
    };

    const handleStatCardClick = (title, data) => handleOpenModal('listView', { title, data });

    const handleSignOut = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) alert(`Sign out failed: ${error.message}`);
    };
    
    const renderView = () => {
        if (loading) {
            return <div className="flex h-full w-full items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-indigo-600" /></div>;
        }
        switch (activeView) {
            case 'dashboard': return <DashboardView stats={dashboardStats} activeStudents={activeStudents} onSearch={handleDashboardSearch} profile={dashboardProfile} onCardClick={handleStatCardClick} />;
            case 'seats': return <SeatMatrix seats={seats} onSeatClick={(seat) => handleOpenModal('addStudent', { seatNumber: seat.number, gender: seat.gender })} onViewStudent={(id) => { setActiveView('dashboard'); handleDashboardSearch(id); }} />;
            case 'students': return <StudentManagement students={activeStudents} onAddStudent={() => handleOpenModal('addStudent')} onDepart={(s) => handleOpenModal('departStudent', s)} onEdit={(s) => handleOpenModal('editStudent', s)} onDelete={(s) => handleOpenModal('deleteStudent', s)} onView={(id) => { setActiveView('dashboard'); handleDashboardSearch(id); }} />;
            case 'fees': return <FeeManagement students={activeStudents} onOpenProfile={(s) => handleOpenModal('feeProfile', s)} onMarkAsDue={handleMarkAsDue} />;
            case 'departures': return <DeparturesView departedStudents={departedStudents} />;
            case 'bookSearch': return <BookSearchView />;
            case 'settings': return <SettingsView feeStructure={feeStructure} onUpdate={setFeeStructure} />;
            default: return <DashboardView stats={dashboardStats} activeStudents={activeStudents} onSearch={handleDashboardSearch} profile={dashboardProfile} onCardClick={handleStatCardClick} />;
        }
    };
    
    if (loading && !session) return <SplashScreen />;
    if (!session) return <Auth />;

    return (
        <div className="flex h-screen bg-gray-100 font-sans">
            <Sidebar setActiveView={setActiveView} activeView={activeView} onSignOut={handleSignOut} />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header userEmail={session.user.email} />
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-4 md:p-6 lg:p-8">
                    <div className="max-w-7xl mx-auto">
                        {renderView()}
                    </div>
                </main>
            </div>
            {isModalOpen && <ModalRouter isSubmitting={isSubmitting} content={modalContent} onClose={handleCloseModal} students={students} seats={seats} feeStructure={feeStructure} onAddStudent={addStudent} onEditStudent={editStudent} onDeleteStudent={deleteStudent} onPayFee={handleFeePayment} onDepart={handleStudentDeparture} />}
        </div>
    );
};

// --- MODAL ROUTER ---
const ModalRouter = ({ content, onClose, isSubmitting, ...props }) => {
    const { type, item } = content;
    const renderModal = () => {
        switch (type) {
            case 'addStudent': return <AddStudentForm onAddStudent={props.onAddStudent} prefill={item} isSubmitting={isSubmitting} {...props} />;
            case 'editStudent': return <EditStudentForm student={item} onEditStudent={props.onEditStudent} isSubmitting={isSubmitting} {...props} />;
            case 'deleteStudent': return <ConfirmationModal item={item} onConfirm={props.onDeleteStudent} text={`Are you sure you want to permanently delete ${item.name}? This action cannot be undone.`} title="Confirm Deletion" confirmText="Delete" isSubmitting={isSubmitting} {...props} />;
            case 'feeProfile': return <StudentFeeProfile student={item} onPay={props.onPayFee} isSubmitting={isSubmitting} {...props} />;
            case 'departStudent': return <DepartStudentForm student={item} onConfirm={props.onDepart} isSubmitting={isSubmitting} {...props} />;
            case 'listView': return <ListViewModal title={item.title} data={item.data} {...props} />;
            default: return null;
        }
    };
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
            <div className="bg-white p-6 md:p-8 rounded-lg shadow-2xl w-full max-w-lg relative max-h-[90vh] overflow-y-auto animate-fade-in-up">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 disabled:opacity-50" disabled={isSubmitting}><X size={24} /></button>
                {renderModal()}
            </div>
        </div>
    );
};


// --- UI & VIEW COMPONENTS ---
const SplashScreen = () => ( <div className="flex h-screen w-full items-center justify-center bg-indigo-600"><div className="text-center text-white animate-pulse"><BookOpen size={80} className="mx-auto mb-4" /><h1 className="text-5xl font-bold tracking-wider">Library</h1></div></div> );
const Header = ({ userEmail }) => ( <header className="bg-white shadow-sm p-4 flex justify-between items-center"><h2 className="text-2xl font-semibold text-gray-700">Library Management System</h2><div className="text-sm text-gray-600 hidden sm:block">{userEmail}</div></header> );
const Sidebar = ({ setActiveView, activeView, onSignOut }) => {
    const navItems = [ { id: 'dashboard', icon: <User size={20} />, label: 'Dashboard' }, { id: 'seats', icon: <Armchair size={20} />, label: 'Seat Matrix' }, { id: 'students', icon: <Users size={20} />, label: 'Students' }, { id: 'fees', icon: <DollarSign size={20} />, label: 'Fees' }, { id: 'departures', icon: <History size={20} />, label: 'Departures' }, { id: 'bookSearch', icon: <BookMarked size={20} />, label: 'Book Search' }, { id: 'settings', icon: <Settings size={20} />, label: 'Settings' }, ];
    return ( <nav className="w-16 md:w-64 bg-white text-gray-800 shadow-lg flex flex-col"><div className="flex items-center justify-center md:justify-start p-4 border-b"><BookOpen className="text-indigo-600 h-8 w-8" /><h1 className="hidden md:block ml-3 text-2xl font-bold text-indigo-600">Library</h1></div><ul className="mt-6 flex-1">{navItems.map(item => (<li key={item.id} className="px-4"><button type="button" onClick={() => setActiveView(item.id)} className={`w-full text-left flex items-center p-3 my-2 rounded-lg transition-colors duration-200 ${activeView === item.id ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-600 hover:bg-indigo-100 hover:text-indigo-600'}`}>{item.icon}<span className="hidden md:block ml-4 font-medium">{item.label}</span></button></li>))}</ul><div className="p-4 border-t"><button onClick={onSignOut} className="flex items-center p-3 w-full rounded-lg transition-colors duration-200 text-red-500 hover:bg-red-100"><LogOut size={20} /><span className="hidden md:block ml-4 font-medium">Sign Out</span></button></div></nav> );
};
const DashboardView = ({ stats, activeStudents, onSearch, profile, onCardClick }) => ( <div className="space-y-6"><div className="bg-white p-6 rounded-lg shadow-md"><h3 className="text-2xl font-semibold text-gray-800 mb-4">Find Student Profile</h3><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input type="text" placeholder="Search by Name, Mobile, or ID (e.g., S001)..." className="w-full p-3 pl-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" onChange={(e) => onSearch(e.target.value)} /></div></div>{profile ? <StudentProfileCard student={profile} /> : (<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"><StatCard label="Active Students" value={stats.totalStudents} color="purple" icon={<Users />} onClick={() => onCardClick('Active Students', activeStudents)} /><StatCard label="Seats Occupied" value={stats.seatsOccupied} color="teal" icon={<Armchair />} /><StatCard label="Pending Fees" value={`$${stats.totalFeesPending}`} color="yellow" icon={<DollarSign />} onClick={() => onCardClick('Students with Pending Fees', stats.feesPendingList)} /><StatCard label="Fee Alerts" value={stats.feesPendingList.length} color="red" icon={<AlertTriangle />} onClick={() => onCardClick('Students with Fee Alerts', stats.feesPendingList)} /></div>)}</div> );
const StatCard = ({ label, value, color, icon, onClick }) => ( <div className={`bg-white p-6 rounded-xl shadow-md flex items-center justify-between border-l-4 border-${color}-500 ${onClick ? 'cursor-pointer hover:shadow-lg hover:scale-105 transition-all' : ''}`} onClick={onClick}><div><p className="text-sm font-medium text-gray-500 uppercase">{label}</p><p className="text-3xl font-bold text-gray-800">{value}</p></div><div className={`p-3 rounded-full bg-${color}-100 text-${color}-500`}>{icon}</div></div> );
const StudentProfileCard = ({ student }) => {
    if (student.notFound) { return ( <div className="bg-white p-6 rounded-lg shadow-xl text-center"><h3 className="text-2xl font-bold text-gray-800">Student Not Found</h3><p className="text-gray-500">No student matches your search query.</p></div> ); }
    const isFeeDue = new Date(student.next_due_date) < getTodayDate();
    return ( <div className="bg-white p-6 rounded-lg shadow-xl animate-fade-in"><div className="flex flex-col sm:flex-row items-center gap-6"><img src={student.photo_url || 'https://placehold.co/128x128/e2e8f0/64748b?text=Photo'} alt={student.name} className="w-32 h-32 rounded-full object-cover border-4 border-indigo-200" /><div className="flex-1 text-center sm:text-left"><h2 className="text-3xl font-bold text-gray-800">{student.title} {student.name}</h2><p className="text-indigo-600 font-mono">{student.student_id}</p><div className="flex items-center justify-center sm:justify-start gap-4 mt-2 text-gray-600"><span className="flex items-center gap-1"><Phone size={16} /> {student.mobile}</span><span className="flex items-center gap-1"><Armchair size={16} /> Seat {student.seat_number}</span></div></div><div className={`p-4 rounded-lg text-center ${isFeeDue ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}><p className="font-bold text-lg">{isFeeDue ? 'Fee Due' : 'Fee Paid'}</p><p className="text-sm">Next Due: {student.next_due_date}</p></div></div></div> );
};
const SeatMatrix = ({ seats, onSeatClick, onViewStudent }) => ( <div className="bg-white p-6 rounded-lg shadow-md"><h3 className="text-2xl font-semibold text-gray-800 mb-4">Seat Matrix</h3><div className="flex items-center space-x-4 mb-6"><div className="flex items-center"><div className="w-4 h-4 bg-pink-200 border border-pink-400 rounded-sm mr-2"></div><span>Girls' Seats</span></div><div className="flex items-center"><div className="w-4 h-4 bg-blue-200 border border-blue-400 rounded-sm mr-2"></div><span>Boys' Seats</span></div><div className="flex items-center"><div className="w-4 h-4 bg-gray-400 border border-gray-600 rounded-sm mr-2"></div><span>Occupied</span></div></div><div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">{seats.map(seat => { const isOccupied = !!seat.occupiedBy; const bgColor = isOccupied ? 'bg-gray-400' : (seat.gender === 'girl' ? 'bg-pink-200' : 'bg-blue-200'); const borderColor = isOccupied ? 'border-gray-600' : (seat.gender === 'girl' ? 'border-pink-400' : 'border-blue-400'); const textColor = isOccupied ? 'text-white' : 'text-gray-700'; const hoverEffect = !isOccupied ? 'hover:bg-green-300 hover:border-green-500' : 'hover:scale-105'; return (<div key={seat.number} className={`relative group w-full aspect-square flex flex-col items-center justify-center border rounded-md cursor-pointer ${bgColor} ${borderColor} ${textColor} transition-all duration-200 ${hoverEffect}`} onClick={() => isOccupied ? onViewStudent(seat.occupiedBy) : onSeatClick(seat)}><span className="font-bold text-lg">{seat.number}</span>{isOccupied && <User size={16} className="mt-1" />}</div>); })}</div></div> );
const StudentManagement = ({ students, onAddStudent, onView, onEdit, onDelete, onDepart }) => ( <div className="bg-white p-6 rounded-lg shadow-md"><div className="flex justify-between items-center mb-4"><h3 className="text-2xl font-semibold text-gray-800">Active Students</h3><button onClick={onAddStudent} className="flex items-center bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"><Plus size={20} className="mr-2" /> Add Student</button></div><div className="overflow-x-auto"><table className="w-full text-left"><thead><tr className="bg-gray-100"><th className="p-3">ID</th><th className="p-3">Name</th><th className="p-3">Mobile</th><th className="p-3">Actions</th></tr></thead><tbody>{students.map(s => ( <tr key={s.id} className="border-b hover:bg-gray-50"><td className="p-3 font-mono">{s.student_id}</td><td className="p-3 font-medium">{s.title} {s.name}</td><td className="p-3">{s.mobile}</td><td className="p-3"><div className="flex gap-2"><button onClick={() => onView(s.student_id)} className="p-2 rounded-md bg-blue-100 text-blue-600 hover:bg-blue-200"><Eye size={16}/></button><button onClick={() => onEdit(s)} className="p-2 rounded-md bg-yellow-100 text-yellow-600 hover:bg-yellow-200"><Edit size={16}/></button><button onClick={() => onDelete(s)} className="p-2 rounded-md bg-red-100 text-red-600 hover:bg-red-200"><Trash2 size={16}/></button><button onClick={() => onDepart(s)} className="p-2 rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200"><LogOut size={16}/></button></div></td></tr> ))}</tbody></table></div></div> );

// MODIFIED: FeeManagement now includes the onMarkAsDue prop and button
const FeeManagement = ({ students, onOpenProfile, onMarkAsDue }) => (
    <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-2xl font-semibold text-gray-800 mb-4">Fee Status</h3>
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead>
                    <tr className="bg-gray-100">
                        <th className="p-3">Name</th>
                        <th className="p-3">Fee Status</th>
                        <th className="p-3">Next Due Date</th>
                        <th className="p-3">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {students.map(s => {
                        const isDue = new Date(s.next_due_date) < getTodayDate();
                        return (
                            <tr key={s.id} className="border-b hover:bg-gray-50">
                                <td className="p-3 font-medium">{s.name}</td>
                                <td className="p-3">
                                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${isDue ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                                        {isDue ? 'Due' : 'Paid'}
                                    </span>
                                </td>
                                <td className="p-3">{s.next_due_date}</td>
                                <td className="p-3">
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => onOpenProfile(s)} className="bg-blue-500 text-white px-3 py-1 text-sm rounded-md hover:bg-blue-600">
                                            View Profile
                                        </button>
                                        {!isDue && (
                                            <button 
                                                onClick={() => onMarkAsDue(s.id)} 
                                                className="bg-yellow-500 text-white px-3 py-1 text-sm rounded-md hover:bg-yellow-600 flex items-center gap-1"
                                                title="Mark fee as due immediately"
                                            >
                                                <AlertTriangle size={14} />
                                                Mark as Due
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    </div>
);

// --- NEW & IMPROVED COMPONENTS ---

// NEW: Fully functional SettingsView component
const SettingsView = ({ feeStructure, onUpdate }) => {
    const [fees, setFees] = useState(feeStructure);
    const [saved, setSaved] = useState(false);

    const handleSave = () => {
        onUpdate(fees);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000); // Hide message after 2 seconds
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md max-w-md mx-auto">
            <h3 className="text-2xl font-semibold text-gray-800 mb-6">Fee Structure Settings</h3>
            <div className="space-y-4">
                <div>
                    <label htmlFor="full-time-fee" className="block text-sm font-medium text-gray-700 mb-1">
                        Full-time Fee ($)
                    </label>
                    <input
                        type="number"
                        id="full-time-fee"
                        value={fees['Full-time']}
                        onChange={e => setFees({ ...fees, 'Full-time': Number(e.target.value) })}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </div>
                <div>
                    <label htmlFor="half-time-fee" className="block text-sm font-medium text-gray-700 mb-1">
                        Half-time Fee ($)
                    </label>
                    <input
                        type="number"
                        id="half-time-fee"
                        value={fees['Half-time']}
                        onChange={e => setFees({ ...fees, 'Half-time': Number(e.target.value) })}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </div>
            </div>
            <button
                onClick={handleSave}
                className="w-full mt-6 bg-indigo-600 text-white p-3 rounded-lg hover:bg-indigo-700 transition duration-200 font-semibold flex items-center justify-center"
            >
                {saved ? (
                    <>
                        <CheckCircle size={20} className="mr-2" /> Saved!
                    </>
                ) : (
                    'Save Changes'
                )}
            </button>
        </div>
    );
};

const DeparturesView = ({ departedStudents }) => (
    <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-2xl font-semibold text-gray-800 mb-4">Departed Student History</h3>
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead>
                    <tr className="bg-gray-100">
                        <th className="p-3">Name</th>
                        <th className="p-3">Departure Date</th>
                        <th className="p-3 text-center">Credit (Days)</th>
                        <th className="p-3">Transferred To</th>
                    </tr>
                </thead>
                <tbody>
                    {departedStudents.length > 0 ? departedStudents.map(s => (
                        <tr key={s.id} className="border-b hover:bg-gray-50">
                            <td className="p-3 font-medium">{s.name} ({s.student_id})</td>
                            <td className="p-3">{s.departure_date}</td>
                            <td className="p-3 text-center">
                                {s.transfer_log ? (
                                    <span className="font-bold text-green-700">{s.transfer_log.daysTransferred}</span>
                                ) : (
                                    <span className="text-gray-500">-</span>
                                )}
                            </td>
                            <td className="p-3">
                                {s.transfer_log ? (
                                    <div>
                                        <p className="font-medium">{s.transfer_log.transferredToName}</p>
                                        <p className="text-xs text-gray-500 font-mono">{s.transfer_log.transferredToId}</p>
                                    </div>
                                ) : (
                                    <span className="text-gray-500">N/A</span>
                                )}
                            </td>
                        </tr>
                    )) : <tr><td colSpan="4" className="text-center p-4 text-gray-500">No students have departed yet.</td></tr>}
                </tbody>
            </table>
        </div>
    </div>
);

const BookSearchView = () => {
    const [query, setQuery] = useState('');
    const [searchType, setSearchType] = useState('title');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!query.trim()) return;

        setLoading(true);
        setSearched(true);
        setResults([]);
        try {
            const searchParam = searchType === 'title' ? 'title' : 'author';
            const response = await fetch(`https://openlibrary.org/search.json?${searchParam}=${encodeURIComponent(query)}&limit=20`);
            if (!response.ok) throw new Error('Network response was not ok');
            const data = await response.json();
            setResults(data.docs);
        } catch (error) {
            console.error("Error fetching book data:", error);
            alert("Could not fetch book data. Please try again later.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-2xl font-semibold text-gray-800 mb-4">Search Open Library</h3>
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2 mb-6">
                <select value={searchType} onChange={e => setSearchType(e.target.value)} className="p-3 border rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="title">By Title</option>
                    <option value="author">By Author</option>
                </select>
                <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={`Enter a book ${searchType}...`} className="flex-grow p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                <button type="submit" disabled={loading} className="flex items-center justify-center bg-indigo-600 text-white px-4 py-3 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50">
                    <Search size={20} className="mr-2" /> {loading ? 'Searching...' : 'Search'}
                </button>
            </form>

            {loading && <div className="text-center p-8"><Loader2 className="h-10 w-10 animate-spin mx-auto text-indigo-500" /></div>}
            {!loading && searched && results.length === 0 && (<div className="text-center p-8 text-gray-500">No books found. Please try another search.</div>)}
            {!loading && results.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {results.map(book => (
                        <div key={book.key} className="border rounded-lg p-3 text-center flex flex-col items-center shadow-sm hover:shadow-lg transition-shadow">
                            <img src={book.cover_i ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg` : 'https://placehold.co/180x270/e2e8f0/64748b?text=No+Cover'} alt={`Cover for ${book.title}`} className="w-full h-48 object-contain mb-2" loading="lazy" />
                            <div className="mt-auto pt-2">
                                <h4 className="font-semibold text-sm leading-tight">{book.title}</h4>
                                <p className="text-xs text-gray-500 mt-1">{book.author_name?.[0]}{book.first_publish_year && ` (${book.first_publish_year})`}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// --- MODAL & FORM COMPONENTS (IMPROVED WITH LOADING STATES) ---
const Button = ({ onClick, type = "button", disabled, className, children, text, loadingText }) => (
    <button type={type} onClick={onClick} disabled={disabled} className={`flex items-center justify-center px-4 py-2 font-semibold rounded-lg transition-colors duration-200 disabled:opacity-60 disabled:cursor-not-allowed ${className}`}>
        {disabled && <Loader2 className="animate-spin mr-2 h-5 w-5" />}
        {disabled ? loadingText : text}
        {children}
    </button>
);

const ConfirmationModal = ({ onConfirm, onClose, text, title, confirmText, item, isSubmitting }) => (
    <div>
        <h3 className={`text-2xl font-semibold mb-2 ${confirmText === 'Delete' ? 'text-red-700' : 'text-gray-800'}`}>{title}</h3>
        <p className="text-gray-600 mb-6">{text}</p>
        <div className="flex justify-end gap-4">
            <button onClick={onClose} disabled={isSubmitting} className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 disabled:opacity-60">Cancel</button>
            <Button onClick={() => onConfirm(item)} disabled={isSubmitting} text={confirmText} loadingText={`${confirmText}...`} className={confirmText === 'Delete' ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'} />
        </div>
    </div>
);

const AddStudentForm = ({ onAddStudent, seats, prefill, feeStructure, isSubmitting }) => {
    const [formData, setFormData] = useState({ title: prefill?.gender === 'girl' ? 'Ms.' : 'Mr.', name: '', mobile: '', admissionType: 'Full-time', seatNumber: prefill?.seatNumber || '', admissionDate: new Date().toISOString().split('T')[0] });
    const [photoFile, setPhotoFile] = useState(null); const [photoPreview, setPhotoPreview] = useState(null); const [error, setError] = useState('');
    const handleChange = (e) => { const { name, value } = e.target; setFormData(prev => ({ ...prev, [name]: value })); };
    const handlePhotoChange = (e) => { if (e.target.files && e.target.files[0]) { const file = e.target.files[0]; setPhotoFile(file); setPhotoPreview(URL.createObjectURL(file)); } };
    const handleSubmit = (e) => { e.preventDefault(); setError(''); if (!photoFile) { setError('Photo is compulsory for admission.'); return; } onAddStudent(formData, photoFile); };
    const availableSeats = seats.filter(s => !s.occupiedBy && s.gender === (formData.title === 'Mr.' ? 'boy' : 'girl'));
    return ( <form onSubmit={handleSubmit} className="space-y-4"><h3 className="text-2xl font-semibold mb-6 text-gray-800">New Student Admission</h3><div className="flex items-center justify-center"><label htmlFor="photo-upload" className="cursor-pointer"><div className={`w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center border-2 border-dashed ${error ? 'border-red-500' : 'hover:border-indigo-500'}`}>{photoPreview ? <img src={photoPreview} alt="Preview" className="w-full h-full rounded-full object-cover"/> : <ImageIcon className="text-gray-400" size={40} />}</div></label><input id="photo-upload" type="file" className="hidden" accept="image/*" onChange={handlePhotoChange} /></div>{error && <p className="text-red-500 text-sm text-center">{error}</p>}<div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div><label>Title</label><select name="title" value={formData.title} onChange={handleChange} className="w-full p-2 border rounded-lg bg-white"><option>Mr.</option><option>Ms.</option></select></div><div><label>Full Name</label><input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full p-2 border rounded-lg" required /></div><div><label>Mobile</label><input type="tel" name="mobile" value={formData.mobile} onChange={handleChange} className="w-full p-2 border rounded-lg" required /></div><div><label>Admission Date</label><input type="date" name="admissionDate" value={formData.admissionDate} onChange={handleChange} className="w-full p-2 border rounded-lg" required /></div><div><label>Admission Type</label><select name="admissionType" value={formData.admissionType} onChange={handleChange} className="w-full p-2 border rounded-lg bg-white"><option value="Full-time">Full-time</option><option value="Half-time">Half-time</option></select></div><div><label>Assign Seat</label><select name="seatNumber" value={formData.seatNumber} onChange={e => setFormData({...formData, seatNumber: parseInt(e.target.value)})} className="w-full p-2 border rounded-lg bg-white" required disabled={!!prefill?.seatNumber}><option value="">Select a seat</option>{availableSeats.map(s => <option key={s.number} value={s.number}>Seat {s.number}</option>)}</select></div></div><div className="p-4 bg-indigo-50 rounded-lg text-center"><h4 className="font-semibold text-indigo-800">Fee for {formData.admissionType}: <span className="font-bold">${feeStructure[formData.admissionType]}</span></h4></div><Button type="submit" disabled={isSubmitting} text="Confirm Admission" loadingText="Saving..." className="w-full mt-6 bg-indigo-600 text-white p-3 hover:bg-indigo-700" /> </form> );
};

const EditStudentForm = ({ student, onEditStudent, isSubmitting }) => {
    const [formData, setFormData] = useState({ name: student.name, mobile: student.mobile });
    const handleSubmit = (e) => { e.preventDefault(); onEditStudent(student.id, formData); };
    return ( <form onSubmit={handleSubmit} className="space-y-4"><h3 className="text-2xl font-semibold mb-6 text-gray-800">Edit {student.name}</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div><label>Full Name</label><input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-2 border rounded-lg" required /></div><div><label>Mobile</label><input type="tel" value={formData.mobile} onChange={e => setFormData({...formData, mobile: e.target.value})} className="w-full p-2 border rounded-lg" required /></div></div><Button type="submit" disabled={isSubmitting} text="Save Changes" loadingText="Saving..." className="w-full mt-6 bg-indigo-600 text-white p-3 hover:bg-indigo-700" /></form> );
};

const StudentFeeProfile = ({ student, onPay, isSubmitting }) => {
    const [paymentMethod, setPaymentMethod] = useState('UPI');
    const handleConfirmPayment = () => { onPay(student.id, { date: new Date().toISOString().split('T')[0], amount: student.fee_amount, method: paymentMethod }); };
    return ( <div><h3 className="text-2xl font-semibold mb-2 text-gray-800">{student.name}'s Fee Profile</h3><p className="text-gray-600 mb-4">{student.student_id} | Next Due: {student.next_due_date}</p><div className="mb-4"><h4 className="font-semibold text-gray-700 mb-2">Payment History</h4><div className="max-h-40 overflow-y-auto border rounded-lg p-2 bg-gray-50">{student.payment_history && student.payment_history.length > 0 ? student.payment_history.map((p, i) => ( <div key={i} className="flex justify-between items-center p-2 border-b"><p>{p.date}: <span className="font-bold">${p.amount}</span></p><span className="text-xs bg-gray-200 px-2 py-1 rounded-full">{p.method}</span></div> )) : <p className="text-center text-gray-500">No payments recorded.</p>}</div></div>{student.received_credit_log && student.received_credit_log.length > 0 && (<div className="mb-4"><h4 className="font-semibold text-gray-700 mb-2">Credit History</h4><div className="max-h-40 overflow-y-auto border rounded-lg p-2 bg-gray-50">{student.received_credit_log.map((log, i) => ( <div key={i} className="p-2 border-b text-sm">Received <strong>{log.daysReceived} days</strong> from {log.fromName} on {log.date}</div> ))}</div></div>)}<div><h4 className="font-semibold text-gray-700 mb-2">Receive New Payment</h4><div className="p-4 border rounded-lg"><p>Amount Due: <span className="font-bold text-xl">${student.fee_amount}</span></p><div className="my-2"><label className="block text-sm">Payment Method</label><select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className="w-full p-2 border rounded-lg bg-white"><option>UPI</option><option>Cash</option></select></div><Button onClick={handleConfirmPayment} disabled={isSubmitting} text="Confirm Payment" loadingText="Processing..." className="w-full mt-2 bg-green-600 text-white p-3 hover:bg-green-700" /></div></div></div> );
};

const DepartStudentForm = ({ student, students, onConfirm, isSubmitting }) => {
    const [transferTo, setTransferTo] = useState('');
    const today = new Date(); const nextDueDate = new Date(student.next_due_date); const remainingDays = nextDueDate > today ? Math.ceil((nextDueDate - today) / (1000 * 60 * 60 * 24)) : 0;
    return ( <div><h3 className="text-2xl font-semibold mb-2 text-red-700">Student Departure</h3><p className="mb-4">Confirm departure for <strong>{student.name}</strong> ({student.student_id})?</p><div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-4"><h4 className="font-semibold">Credit Calculation</h4><p>Remaining billable days: <span className="font-bold">{remainingDays}</span></p>{remainingDays > 0 && <p className="text-sm text-gray-600">You can transfer these days to another student.</p>}</div>{remainingDays > 0 && (<div><label className="block text-sm font-medium">Transfer Remaining Days To (Optional)</label><select value={transferTo} onChange={e => setTransferTo(e.target.value)} className="w-full p-2 border rounded-lg bg-white"><option value="">Don't Transfer</option>{students.filter(s => s.id !== student.id && s.status === 'active').map(s => ( <option key={s.id} value={s.id}>{s.name} ({s.student_id})</option> ))}</select></div>)}<Button onClick={() => onConfirm(student.id, transferTo)} disabled={isSubmitting} text="Confirm Departure" loadingText="Departing..." className="w-full mt-6 bg-red-600 text-white p-3 hover:bg-red-700" /></div> );
};

const ListViewModal = ({ title, data }) => ( <div><h3 className="text-2xl font-semibold mb-4 text-gray-800">{title}</h3><div className="max-h-80 overflow-y-auto"><div className="grid grid-cols-3 items-center p-2 border-b bg-gray-50 font-semibold text-sm text-gray-600 sticky top-0"><span>Student</span><span>Admission Date</span><span className="text-right">Next Due Date</span></div>{data.length > 0 ? data.map(s => ( <div key={s.id} className="grid grid-cols-3 items-center p-2 border-b"><div><p className="font-medium">{s.name}</p><p className="text-sm text-gray-500">{s.student_id}</p></div><div className="text-sm text-gray-600"><p>{s.admission_date}</p></div><div className="text-sm text-gray-600 text-right"><p>{s.next_due_date}</p></div></div> )) : <p className="text-center text-gray-500 p-4">No students to display.</p>}</div></div> );

export default App;