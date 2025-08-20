// src/AppContent.js
import React, { useState, useMemo, useCallback } from 'react';
import { useApp } from './App';
import { supabase } from './supabaseClient';
import {
    BookOpen, Users, DollarSign, AlertTriangle, Plus, X, Search, Armchair, User,
    Phone, Image as ImageIcon, Calendar, Settings, LogOut, ArrowRight,
    CheckCircle, Edit, Trash2, Eye, History
} from 'lucide-react';

const AppContent = () => {
    const { libraryData, updateLibraryData } = useApp();
    const { students, feeStructure, seats } = libraryData;

    const [activeView, setActiveView] = useState('dashboard');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalContent, setModalContent] = useState({ type: '', item: null });
    const [dashboardProfile, setDashboardProfile] = useState(null);

    const activeStudents = useMemo(() => students.filter(s => s.status === 'active'), [students]);
    const departedStudents = useMemo(() => students.filter(s => s.status === 'departed'), [students]);

    const dashboardStats = useMemo(() => {
        const feesPending = activeStudents.filter(s => new Date(s.nextDueDate) < new Date());
        return {
            totalStudents: activeStudents.length,
            seatsOccupied: activeStudents.length,
            feesPendingList: feesPending,
            totalFeesPending: feesPending.reduce((acc, s) => acc + s.feeAmount, 0),
        };
    }, [activeStudents]);

    const handleOpenModal = useCallback((type, item = null) => {
        setModalContent({ type, item });
        setIsModalOpen(true);
    }, []);

    const handleCloseModal = () => setIsModalOpen(false);
    const signOut = async () => { await supabase.auth.signOut(); };

    const addStudent = (studentData) => {
        const newId = `S${(students.length + 1).toString().padStart(3, '0')}`;
        const feeAmount = feeStructure[studentData.admissionType];
        const newStudent = { ...studentData, id: newId, feeAmount, status: 'active', paymentHistory: [], receivedCreditLog: [], nextDueDate: studentData.admissionDate };
        const newStudents = [...students, newStudent];
        const newSeats = seats.map(seat => seat.number === newStudent.seatNumber ? { ...seat, occupiedBy: newId } : seat);
        updateLibraryData({ ...libraryData, students: newStudents, seats: newSeats });
        handleCloseModal();
    };

    const editStudent = (studentId, updatedData) => {
        const newStudents = students.map(s => s.id === studentId ? { ...s, ...updatedData } : s);
        updateLibraryData({ ...libraryData, students: newStudents });
        handleCloseModal();
    };

    const deleteStudent = (studentId) => {
        const newStudents = students.filter(s => s.id !== studentId);
        const newSeats = seats.map(seat => seat.occupiedBy === studentId ? { ...seat, occupiedBy: null } : seat);
        updateLibraryData({ ...libraryData, students: newStudents, seats: newSeats });
        handleCloseModal();
    };

    const handleFeePayment = (studentId, paymentDetails) => {
        const newStudents = students.map(s => {
            if (s.id === studentId) {
                const newHistory = [...s.paymentHistory, paymentDetails];
                const nextDueDate = new Date(s.nextDueDate);
                nextDueDate.setMonth(nextDueDate.getMonth() + 1);
                return { ...s, paymentHistory: newHistory, nextDueDate: nextDueDate.toISOString().split('T')[0] };
            }
            return s;
        });
        updateLibraryData({ ...libraryData, students: newStudents });
        handleCloseModal();
    };

    const handleStudentDeparture = (studentId, transferTargetId) => {
        const departingStudent = students.find(s => s.id === studentId);
        const today = new Date();
        const nextDueDate = new Date(departingStudent.nextDueDate);
        let remainingDays = nextDueDate > today ? Math.ceil((nextDueDate - today) / (1000 * 60 * 60 * 24)) : 0;
        const newStudents = students.map(s => {
            if (s.id === studentId) { return { ...s, status: 'departed', departureDate: today.toISOString().split('T')[0], transferLog: transferTargetId ? { transferredToId: transferTargetId, transferredToName: students.find(st => st.id === transferTargetId)?.name || '', daysTransferred: remainingDays } : null }; }
            if (s.id === transferTargetId && remainingDays > 0) {
                const targetDueDate = new Date(s.nextDueDate);
                targetDueDate.setDate(targetDueDate.getDate() + remainingDays);
                const newCreditLog = { fromId: studentId, fromName: departingStudent.name, daysReceived: remainingDays, date: today.toISOString().split('T')[0] };
                return { ...s, nextDueDate: targetDueDate.toISOString().split('T')[0], receivedCreditLog: [...s.receivedCreditLog, newCreditLog] };
            }
            return s;
        });
        const newSeats = seats.map(seat => seat.occupiedBy === studentId ? { ...seat, occupiedBy: null } : seat);
        updateLibraryData({ ...libraryData, students: newStudents, seats: newSeats });
        handleCloseModal();
    };

    const handleDashboardSearch = (query) => {
        if (!query) { setDashboardProfile(null); return; }
        const lowerQuery = query.toLowerCase();
        const found = students.find(s => s.name.toLowerCase().includes(lowerQuery) || s.mobile.includes(lowerQuery) || s.id.toLowerCase() === lowerQuery);
        setDashboardProfile(found || { notFound: true });
    };

    const handleStatCardClick = (title, data) => { handleOpenModal('listView', { title, data }); };
    const handleUpdateFeeStructure = (newFeeStructure) => { updateLibraryData({ ...libraryData, feeStructure: newFeeStructure }); };

    const renderView = () => {
        switch (activeView) {
            case 'dashboard': return <DashboardView stats={dashboardStats} activeStudents={activeStudents} onSearch={handleDashboardSearch} profile={dashboardProfile} onCardClick={handleStatCardClick} />;
            case 'seats': return <SeatMatrix seats={seats} students={students} onSeatClick={(seat) => handleOpenModal('addStudent', { seatNumber: seat.number, gender: seat.gender })} onViewStudent={(id) => { setActiveView('dashboard'); handleDashboardSearch(id); }} />;
            case 'students': return <StudentManagement students={activeStudents} onAddStudent={() => handleOpenModal('addStudent')} onDepart={(s) => handleOpenModal('departStudent', s)} onEdit={(s) => handleOpenModal('editStudent', s)} onDelete={(s) => handleOpenModal('deleteStudent', s)} onView={(id) => { setActiveView('dashboard'); handleDashboardSearch(id); }} />;
            case 'fees': return <FeeManagement students={activeStudents} onOpenProfile={(s) => handleOpenModal('feeProfile', s)} />;
            case 'departures': return <DeparturesView departedStudents={departedStudents} />;
            case 'settings': return <SettingsView feeStructure={feeStructure} onUpdate={handleUpdateFeeStructure} />;
            default: return <DashboardView stats={dashboardStats} activeStudents={activeStudents} onSearch={handleDashboardSearch} profile={dashboardProfile} onCardClick={handleStatCardClick} />;
        }
    };

    return (
        <div className="flex h-screen bg-gray-100 font-sans">
            <Sidebar setActiveView={setActiveView} activeView={activeView} onSignOut={signOut} />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header />
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-4 md:p-6 lg:p-8">
                    {renderView()}
                </main>
            </div>
            {isModalOpen && <ModalRouter content={modalContent} onClose={handleCloseModal} students={students} seats={seats} feeStructure={feeStructure} onAddStudent={addStudent} onEditStudent={editStudent} onDeleteStudent={deleteStudent} onPayFee={handleFeePayment} onDepart={handleStudentDeparture} />}
        </div>
    );
};

// --- MODAL ROUTER ---
const ModalRouter = ({ content, onClose, ...props }) => {
    const { type, item } = content;
    const commonProps = { onClose, ...props };
    const renderModal = () => {
        switch (type) {
            case 'addStudent': return <AddStudentForm onAddStudent={props.onAddStudent} prefill={item} {...commonProps} />;
            case 'editStudent': return <EditStudentForm student={item} onEditStudent={props.onEditStudent} {...commonProps} />;
            case 'deleteStudent': return <ConfirmationModal item={item} onConfirm={() => props.onDeleteStudent(item.id)} text={`Are you sure you want to permanently delete ${item.name}? This action cannot be undone.`} title="Confirm Deletion" confirmText="Delete" {...commonProps} />;
            case 'feeProfile': return <StudentFeeProfile student={item} onPay={props.onPayFee} {...commonProps} />;
            case 'departStudent': return <DepartStudentForm student={item} onConfirm={props.onDepart} {...commonProps} />;
            case 'listView': return <ListViewModal title={item.title} data={item.data} {...commonProps} />;
            default: return null;
        }
    };
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-lg relative max-h-[90vh] overflow-y-auto animate-fade-in-up">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800"><X size={24} /></button>
                {renderModal()}
            </div>
        </div>
    );
};
// --- UI & VIEW COMPONENTS ---
const Header = () => ( <header className="bg-white shadow-sm p-4 flex justify-between items-center"><h2 className="text-2xl font-semibold text-gray-700">Library Management System</h2></header> );
const Sidebar = ({ setActiveView, activeView, onSignOut }) => {
    const navItems = [ { id: 'dashboard', icon: <User size={20} />, label: 'Dashboard' }, { id: 'seats', icon: <Armchair size={20} />, label: 'Seat Matrix' }, { id: 'students', icon: <Users size={20} />, label: 'Students' }, { id: 'fees', icon: <DollarSign size={20} />, label: 'Fees' }, { id: 'departures', icon: <History size={20} />, label: 'Departures' }, { id: 'settings', icon: <Settings size={20} />, label: 'Settings' }, ];
    return ( <nav className="w-16 md:w-64 bg-white text-gray-800 shadow-lg flex flex-col"> <div className="flex items-center justify-center md:justify-start p-4 border-b"> <BookOpen className="text-indigo-600 h-8 w-8" /> <h1 className="hidden md:block ml-3 text-2xl font-bold text-indigo-600">Library</h1> </div> <ul className="mt-6 flex-1"> {navItems.map(item => ( <li key={item.id} className="px-4"> <a href="#" onClick={(e) => { e.preventDefault(); setActiveView(item.id); }} className={`flex items-center p-3 my-2 rounded-lg transition-colors duration-200 ${activeView === item.id ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-600 hover:bg-indigo-100 hover:text-indigo-600'}`}> {item.icon} <span className="hidden md:block ml-4 font-medium">{item.label}</span> </a> </li> ))} </ul> <div className="p-4 border-t"> <button onClick={onSignOut} className="flex items-center w-full p-3 rounded-lg text-gray-600 hover:bg-red-100 hover:text-red-600"> <LogOut size={20} /> <span className="hidden md:block ml-4 font-medium">Log Out</span> </button> </div> </nav> );
};
const DashboardView = ({ stats, activeStudents, onSearch, profile, onCardClick }) => ( <div> <div className="bg-white p-6 rounded-lg shadow-md mb-6"> <h3 className="text-2xl font-semibold text-gray-800 mb-4">Find Student Profile</h3> <div className="relative"> <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /> <input type="text" placeholder="Search by Name, Mobile, or ID (e.g., S001)..." className="w-full p-3 pl-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" onChange={(e) => onSearch(e.target.value)} /> </div> </div> {profile ? <StudentProfileCard student={profile} /> : ( <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"> <StatCard label="Active Students" value={stats.totalStudents} color="purple" icon={<Users />} onClick={() => onCardClick('Active Students', activeStudents)} /> <StatCard label="Seats Occupied" value={stats.seatsOccupied} color="teal" icon={<Armchair />} /> <StatCard label="Pending Fees" value={`$${stats.totalFeesPending}`} color="yellow" icon={<DollarSign />} onClick={() => onCardClick('Students with Pending Fees', stats.feesPendingList)} /> <StatCard label="Fee Alerts" value={stats.feesPendingList.length} color="red" icon={<AlertTriangle />} onClick={() => onCardClick('Students with Fee Alerts', stats.feesPendingList)} /> </div> )} </div> );
const StatCard = ({ label, value, color, icon, onClick }) => ( <div className={`bg-white p-6 rounded-xl shadow-md flex items-center justify-between border-l-4 border-${color}-500 ${onClick ? 'cursor-pointer hover:shadow-lg hover:scale-105 transition-all' : ''}`} onClick={onClick}> <div> <p className="text-sm font-medium text-gray-500 uppercase">{label}</p> <p className="text-3xl font-bold text-gray-800">{value}</p> </div> <div className={`p-3 rounded-full bg-${color}-100 text-${color}-500`}>{icon}</div> </div> );
const StudentProfileCard = ({ student }) => { if (student.notFound) { return ( <div className="bg-white p-6 rounded-lg shadow-xl text-center"> <h3 className="text-2xl font-bold text-gray-800">Student Not Found</h3> <p className="text-gray-500">No student matches your search query.</p> </div> ); } const isFeeDue = new Date(student.nextDueDate) < new Date(); return ( <div className="bg-white p-6 rounded-lg shadow-xl animate-fade-in"> <div className="flex flex-col sm:flex-row items-center gap-6"> <img src={student.photo} alt={student.name} className="w-32 h-32 rounded-full object-cover border-4 border-indigo-200" /> <div className="flex-1 text-center sm:text-left"> <h2 className="text-3xl font-bold text-gray-800">{student.title} {student.name}</h2> <p className="text-indigo-600 font-mono">{student.id}</p> <div className="flex items-center justify-center sm:justify-start gap-4 mt-2 text-gray-600"> <span className="flex items-center gap-1"><Phone size={16} /> {student.mobile}</span> <span className="flex items-center gap-1"><Armchair size={16} /> Seat {student.seatNumber}</span> </div> </div> <div className={`p-4 rounded-lg text-center ${isFeeDue ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}> <p className="font-bold text-lg">{isFeeDue ? 'Fee Due' : 'Fee Paid'}</p> <p className="text-sm">Next Due: {student.nextDueDate}</p> </div> </div> </div> ); };
const SeatMatrix = ({ seats, students, onSeatClick, onViewStudent }) => ( <div className="bg-white p-6 rounded-lg shadow-md"> <h3 className="text-2xl font-semibold text-gray-800 mb-4">Seat Matrix</h3> <div className="flex items-center space-x-4 mb-6"> <div className="flex items-center"><div className="w-4 h-4 bg-pink-200 border border-pink-400 rounded-sm mr-2"></div><span>Girls' Seats</span></div> <div className="flex items-center"><div className="w-4 h-4 bg-blue-200 border border-blue-400 rounded-sm mr-2"></div><span>Boys' Seats</span></div> <div className="flex items-center"><div className="w-4 h-4 bg-gray-400 border border-gray-600 rounded-sm mr-2"></div><span>Occupied</span></div> </div> <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2"> {seats.map(seat => { const student = seat.occupiedBy ? students.find(s => s.id === seat.occupiedBy) : null; const isOccupied = !!student; const bgColor = isOccupied ? 'bg-gray-400' : (seat.gender === 'girl' ? 'bg-pink-200' : 'bg-blue-200'); const borderColor = isOccupied ? 'border-gray-600' : (seat.gender === 'girl' ? 'border-pink-400' : 'border-blue-400'); const textColor = isOccupied ? 'text-white' : 'text-gray-700'; const hoverEffect = !isOccupied ? 'hover:bg-green-300 hover:border-green-500' : 'hover:scale-105'; return ( <div key={seat.number} className={`relative group w-full aspect-square flex flex-col items-center justify-center border rounded-md cursor-pointer ${bgColor} ${borderColor} ${textColor} transition-all duration-200 ${hoverEffect}`} onClick={() => isOccupied ? onViewStudent(seat.occupiedBy) : onSeatClick(seat)}> <span className="font-bold text-lg">{seat.number}</span> {isOccupied && <User size={16} className="mt-1" />} </div> ); })} </div> </div> );
const StudentManagement = ({ students, onAddStudent, onView, onEdit, onDelete, onDepart }) => ( <div className="bg-white p-6 rounded-lg shadow-md"> <div className="flex justify-between items-center mb-4"> <h3 className="text-2xl font-semibold text-gray-800">Active Students</h3> <button onClick={onAddStudent} className="flex items-center bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"> <Plus size={20} className="mr-2" /> Add Student </button> </div> <div className="overflow-x-auto"> <table className="w-full text-left"> <thead> <tr className="bg-gray-100"> <th className="p-3">ID</th> <th className="p-3">Name</th> <th className="p-3">Mobile</th> <th className="p-3">Actions</th> </tr> </thead> <tbody> {students.map(s => ( <tr key={s.id} className="border-b hover:bg-gray-50"> <td className="p-3 font-mono">{s.id}</td> <td className="p-3 font-medium">{s.title} {s.name}</td> <td className="p-3">{s.mobile}</td> <td className="p-3"> <div className="flex gap-2"> <button onClick={() => onView(s.id)} className="p-2 rounded-md bg-blue-100 text-blue-600 hover:bg-blue-200"><Eye size={16}/></button> <button onClick={() => onEdit(s)} className="p-2 rounded-md bg-yellow-100 text-yellow-600 hover:bg-yellow-200"><Edit size={16}/></button> <button onClick={() => onDelete(s)} className="p-2 rounded-md bg-red-100 text-red-600 hover:bg-red-200"><Trash2 size={16}/></button> <button onClick={() => onDepart(s)} className="p-2 rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200"><LogOut size={16}/></button> </div> </td> </tr> ))} </tbody> </table> </div> </div> );
const FeeManagement = ({ students, onOpenProfile }) => ( <div className="bg-white p-6 rounded-lg shadow-md"> <h3 className="text-2xl font-semibold text-gray-800 mb-4">Fee Status</h3> <div className="overflow-x-auto"> <table className="w-full text-left"> <thead> <tr className="bg-gray-100"> <th className="p-3">Name</th> <th className="p-3">Fee Status</th> <th className="p-3">Next Due Date</th> <th className="p-3">Action</th> </tr> </thead> <tbody> {students.map(s => { const isDue = new Date(s.nextDueDate) < new Date(); return ( <tr key={s.id} className="border-b hover:bg-gray-50"> <td className="p-3 font-medium">{s.name}</td> <td className="p-3"><span className={`px-3 py-1 rounded-full text-sm font-semibold ${isDue ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>{isDue ? 'Due' : 'Paid'}</span></td> <td className="p-3">{s.nextDueDate}</td> <td className="p-3"><button onClick={() => onOpenProfile(s)} className="bg-blue-500 text-white px-3 py-1 text-sm rounded-md hover:bg-blue-600">View Profile</button></td> </tr> ); })} </tbody> </table> </div> </div> );
const SettingsView = ({ feeStructure, onUpdate }) => { const [fees, setFees] = useState(feeStructure); const [saved, setSaved] = useState(false); const handleSave = () => { onUpdate(fees); setSaved(true); setTimeout(() => setSaved(false), 2000); }; return ( <div className="bg-white p-6 rounded-lg shadow-md max-w-md mx-auto"> <h3 className="text-2xl font-semibold text-gray-800 mb-4">Fee Structure Settings</h3> <div className="space-y-4"> <div> <label className="block text-sm font-medium text-gray-700">Full-time Fee ($)</label> <input type="number" value={fees['Full-time']} onChange={e => setFees({ ...fees, 'Full-time': Number(e.target.value) })} className="w-full p-2 border rounded-lg" /> </div> <div> <label className="block text-sm font-medium text-gray-700">Half-time Fee ($)</label> <input type="number" value={fees['Half-time']} onChange={e => setFees({ ...fees, 'Half-time': Number(e.target.value) })} className="w-full p-2 border rounded-lg" /> </div> </div> <button onClick={handleSave} className="w-full mt-6 bg-indigo-600 text-white p-3 rounded-lg hover:bg-indigo-700 transition duration-200 font-semibold flex items-center justify-center"> {saved ? <><CheckCircle size={20} className="mr-2" /> Saved!</> : 'Save Changes'} </button> </div> ); };
const DeparturesView = ({ departedStudents }) => ( <div className="bg-white p-6 rounded-lg shadow-md"> <h3 className="text-2xl font-semibold text-gray-800 mb-4">Departed Student History</h3> <div className="overflow-x-auto"> <table className="w-full text-left"> <thead> <tr className="bg-gray-100"> <th className="p-3">Name</th> <th className="p-3">Departure Date</th> <th className="p-3">Credit Transfer Details</th> </tr> </thead> <tbody> {departedStudents.length > 0 ? departedStudents.map(s => ( <tr key={s.id} className="border-b hover:bg-gray-50"> <td className="p-3 font-medium">{s.name} ({s.id})</td> <td className="p-3">{s.departureDate}</td> <td className="p-3">{s.transferLog ? `Transferred ${s.transferLog.daysTransferred} days to ${s.transferLog.transferredToName} (${s.transferLog.transferredToId})` : 'No credit transferred'}</td> </tr> )) : <tr><td colSpan="3" className="text-center p-4 text-gray-500">No students have departed yet.</td></tr>} </tbody> </table> </div> </div> );
const ConfirmationModal = ({ onConfirm, onClose, text, title, confirmText }) => ( <div> <h3 className={`text-2xl font-semibold mb-2 ${confirmText === 'Delete' ? 'text-red-700' : 'text-gray-800'}`}>{title}</h3> <p className="text-gray-600 mb-6">{text}</p> <div className="flex justify-end gap-4"> <button onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300">Cancel</button> <button onClick={onConfirm} className={`px-4 py-2 rounded-lg text-white ${confirmText === 'Delete' ? 'bg-red-600 hover:bg-red-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}>{confirmText}</button> </div> </div> );
const AddStudentForm = ({ onAddStudent, seats, prefill, feeStructure, onClose }) => { const [formData, setFormData] = useState({ title: prefill?.gender === 'girl' ? 'Ms.' : 'Mr.', name: '', mobile: '', admissionType: 'Full-time', seatNumber: prefill?.seatNumber || '', photo: '', photoPreview: null, admissionDate: new Date().toISOString().split('T')[0], }); const [error, setError] = useState(''); const handleChange = (e) => { const { name, value } = e.target; setFormData(prev => ({ ...prev, [name]: value })); }; const handlePhotoChange = (e) => { if (e.target.files && e.target.files[0]) { const reader = new FileReader(); reader.onloadend = () => setFormData(prev => ({ ...prev, photo: reader.result, photoPreview: reader.result })); reader.readAsDataURL(e.target.files[0]); } }; const handleSubmit = (e) => { e.preventDefault(); if (!formData.photo) { setError('Photo is compulsory for admission.'); return; } onAddStudent(formData); }; const availableSeats = seats.filter(s => !s.occupiedBy && s.gender === (formData.title === 'Mr.' ? 'boy' : 'girl')); return ( <form onSubmit={handleSubmit} className="space-y-4"> <h3 className="text-2xl font-semibold mb-6 text-gray-800">New Student Admission</h3> <div className="flex items-center justify-center"> <label htmlFor="photo-upload" className="cursor-pointer"> <div className={`w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center border-2 border-dashed ${error ? 'border-red-500' : 'hover:border-indigo-500'}`}> {formData.photoPreview ? <img src={formData.photoPreview} alt="Preview" className="w-full h-full rounded-full object-cover"/> : <ImageIcon className="text-gray-400" size={40} />} </div> </label> <input id="photo-upload" type="file" className="hidden" accept="image/*" onChange={handlePhotoChange} /> </div> {error && <p className="text-red-500 text-sm text-center">{error}</p>} <div className="grid grid-cols-1 md:grid-cols-2 gap-4"> <div><label>Title</label><select name="title" value={formData.title} onChange={handleChange} className="w-full p-2 border rounded-lg bg-white"><option>Mr.</option><option>Ms.</option></select></div> <div><label>Full Name</label><input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full p-2 border rounded-lg" required /></div> <div><label>Mobile</label><input type="tel" name="mobile" value={formData.mobile} onChange={handleChange} className="w-full p-2 border rounded-lg" required /></div> <div><label>Admission Date</label><input type="date" name="admissionDate" value={formData.admissionDate} onChange={handleChange} className="w-full p-2 border rounded-lg" required /></div> <div><label>Admission Type</label><select name="admissionType" value={formData.admissionType} onChange={handleChange} className="w-full p-2 border rounded-lg bg-white"><option value="Full-time">Full-time</option><option value="Half-time">Half-time</option></select></div> <div><label>Assign Seat</label><select name="seatNumber" value={formData.seatNumber} onChange={e => setFormData({...formData, seatNumber: parseInt(e.target.value)})} className="w-full p-2 border rounded-lg bg-white" required disabled={!!prefill?.seatNumber}><option value="">Select a seat</option>{availableSeats.map(s => <option key={s.number} value={s.number}>Seat {s.number}</option>)}</select></div> </div> <div className="p-4 bg-indigo-50 rounded-lg text-center"><h4 className="font-semibold text-indigo-800">Fee for {formData.admissionType}: <span className="font-bold">${feeStructure[formData.admissionType]}</span></h4></div> <button type="submit" className="w-full mt-6 bg-indigo-600 text-white p-3 rounded-lg hover:bg-indigo-700 font-semibold">Confirm Admission</button> </form> ); };
const EditStudentForm = ({ student, onEditStudent, onClose }) => { const [formData, setFormData] = useState(student); const handleSubmit = (e) => { e.preventDefault(); onEditStudent(student.id, formData); }; return ( <form onSubmit={handleSubmit} className="space-y-4"> <h3 className="text-2xl font-semibold mb-6 text-gray-800">Edit {student.name}</h3> <div className="grid grid-cols-1 md:grid-cols-2 gap-4"> <div><label>Full Name</label><input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-2 border rounded-lg" required /></div> <div><label>Mobile</label><input type="tel" value={formData.mobile} onChange={e => setFormData({...formData, mobile: e.target.value})} className="w-full p-2 border rounded-lg" required /></div> </div> <button type="submit" className="w-full mt-6 bg-indigo-600 text-white p-3 rounded-lg hover:bg-indigo-700 font-semibold">Save Changes</button> </form> ); };
const StudentFeeProfile = ({ student, onPay, onClose }) => { const [paymentMethod, setPaymentMethod] = useState('UPI'); const handleConfirmPayment = () => { onPay(student.id, { date: new Date().toISOString().split('T')[0], amount: student.feeAmount, method: paymentMethod }); }; return ( <div> <h3 className="text-2xl font-semibold mb-2 text-gray-800">{student.name}'s Fee Profile</h3> <p className="text-gray-600 mb-4">{student.id} | Next Due: {student.nextDueDate}</p> <div className="mb-4"> <h4 className="font-semibold text-gray-700 mb-2">Payment History</h4> <div className="max-h-40 overflow-y-auto border rounded-lg p-2 bg-gray-50"> {student.paymentHistory.length > 0 ? student.paymentHistory.map((p, i) => ( <div key={i} className="flex justify-between items-center p-2 border-b"><p>{p.date}: <span className="font-bold">${p.amount}</span></p><span className="text-xs bg-gray-200 px-2 py-1 rounded-full">{p.method}</span></div> )) : <p className="text-center text-gray-500">No payments recorded.</p>} </div> </div> {student.receivedCreditLog.length > 0 && ( <div className="mb-4"> <h4 className="font-semibold text-gray-700 mb-2">Credit History</h4> <div className="max-h-40 overflow-y-auto border rounded-lg p-2 bg-gray-50"> {student.receivedCreditLog.map((log, i) => ( <div key={i} className="p-2 border-b text-sm">Received <strong>{log.daysReceived} days</strong> from {log.fromName} on {log.date}</div> ))} </div> </div> )} <div> <h4 className="font-semibold text-gray-700 mb-2">Receive New Payment</h4> <div className="p-4 border rounded-lg"> <p>Amount Due: <span className="font-bold text-xl">${student.feeAmount}</span></p> <div className="my-2"> <label className="block text-sm">Payment Method</label> <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className="w-full p-2 border rounded-lg bg-white"> <option>UPI</option> <option>Cash</option> </select> </div> <button onClick={handleConfirmPayment} className="w-full mt-2 bg-green-600 text-white p-3 rounded-lg hover:bg-green-700 font-semibold">Confirm Payment</button> </div> </div> </div> ); };
const DepartStudentForm = ({ student, students, onConfirm, onClose }) => { const [transferTo, setTransferTo] = useState(''); const today = new Date(); const nextDueDate = new Date(student.nextDueDate); const remainingDays = nextDueDate > today ? Math.ceil((nextDueDate - today) / (1000 * 60 * 60 * 24)) : 0; return ( <div> <h3 className="text-2xl font-semibold mb-2 text-red-700">Student Departure</h3> <p className="mb-4">Confirm departure for <strong>{student.name}</strong> ({student.id})?</p> <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-4"> <h4 className="font-semibold">Credit Calculation</h4> <p>Remaining billable days: <span className="font-bold">{remainingDays}</span></p> {remainingDays > 0 && <p className="text-sm text-gray-600">You can transfer these days to another student.</p>} </div> {remainingDays > 0 && ( <div> <label className="block text-sm font-medium">Transfer Remaining Days To (Optional)</label> <select value={transferTo} onChange={e => setTransferTo(e.target.value)} className="w-full p-2 border rounded-lg bg-white"> <option value="">Don't Transfer</option> {students.filter(s => s.id !== student.id && s.status === 'active').map(s => ( <option key={s.id} value={s.id}>{s.name} ({s.id})</option> ))} </select> </div> )} <button onClick={() => onConfirm(student.id, transferTo)} className="w-full mt-6 bg-red-600 text-white p-3 rounded-lg hover:bg-red-700 font-semibold">Confirm Departure</button></div> ); };
const ListViewModal = ({ title, data, onClose }) => ( <div> <h3 className="text-2xl font-semibold mb-4 text-gray-800">{title}</h3> <div className="max-h-80 overflow-y-auto"> <div className="grid grid-cols-3 items-center p-2 border-b bg-gray-50 font-semibold text-sm text-gray-600 sticky top-0"> <span>Student</span> <span>Admission Date</span> <span className="text-right">Next Due Date</span> </div> {data.length > 0 ? data.map(s => ( <div key={s.id} className="grid grid-cols-3 items-center p-2 border-b"> <div> <p className="font-medium">{s.name}</p> <p className="text-sm text-gray-500">{s.id}</p> </div> <div className="text-sm text-gray-600"> <p>{s.admissionDate}</p> </div> <div className="text-sm text-gray-600 text-right"> <p>{s.nextDueDate}</p> </div> </div> )) : <p className="text-center text-gray-500 p-4">No students to display.</p>} </div> </div> );

export default AppContent;