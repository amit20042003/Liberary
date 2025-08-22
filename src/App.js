import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
    BookOpen, Users, DollarSign, AlertTriangle, Plus, X, Search, Armchair, User,
    Phone, Image as ImageIcon, Settings, LogOut, CheckCircle, Edit, Trash2, Eye, History, BookMarked, Loader2, Printer, UploadCloud, ArrowLeft, XCircle, Mail, Lock, Download, FilterX, Sun, Moon, MessageSquare, UserX, UserCheck
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
// import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';
import { createClient } from '@supabase/supabase-js';

// --- SUPABASE CLIENT SETUP ---
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

// This check ensures your app will fail loudly during development if the keys are missing.
if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase URL and Anon Key must be provided in your .env.local file.");
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);


// --- AUTHENTICATION COMPONENT ---
const Auth = () => {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) alert(error.error_description || error.message);
        setLoading(false);
    };

    const handleSignUp = async (e) => {
        e.preventDefault();
        setLoading(true);
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) {
            alert(error.error_description || error.message);
        } else {
            alert('Check your email for the login link!');
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-gray-200 flex flex-col items-center justify-center p-4 relative overflow-hidden">
            <div
                className="absolute inset-0 bg-cover bg-center z-0 transition-transform duration-500 ease-in-out transform scale-105"
                style={{
                    backgroundImage: "url('https://images.unsplash.com/photo-1507842217343-583bb7270b66?q=80&w=2070&auto=format&fit=crop')",
                }}
            ></div>
            <div className="absolute inset-0 bg-black opacity-40 z-10"></div>

            <div className="w-full max-w-md z-20">
                <div className="text-center mb-8 animate-fade-in-down" style={{ animationDuration: '1s' }}>
                    <BookOpen className="mx-auto h-16 w-auto text-white drop-shadow-lg" />
                    <h2 className="mt-6 text-4xl font-extrabold text-white tracking-tight" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>
                        Library Management
                    </h2>
                    <p className="mt-2 text-lg text-gray-300">Your digital library assistant</p>
                </div>

                <div className="bg-white bg-opacity-10 backdrop-blur-xl p-8 rounded-2xl shadow-2xl animate-fade-in-up" style={{ animationDuration: '1s' }}>
                    <form onSubmit={isSignUp ? handleSignUp : handleLogin} className="space-y-6">
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
                            <input
                                className="w-full p-3 pl-10 bg-transparent border-b-2 border-gray-300 text-white placeholder-gray-400 focus:outline-none focus:border-indigo-400 transition"
                                type="email"
                                placeholder="Email address"
                                value={email}
                                required
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
                            <input
                                className="w-full p-3 pl-10 bg-transparent border-b-2 border-gray-300 text-white placeholder-gray-400 focus:outline-none focus:border-indigo-400 transition"
                                type="password"
                                placeholder="Password"
                                value={password}
                                required
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                        <div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex justify-center items-center bg-indigo-600 text-white p-3 font-bold tracking-wider rounded-lg shadow-md hover:bg-indigo-700 transform hover:-translate-y-0.5 transition-all duration-150 disabled:opacity-70"
                            >
                                {loading && <Loader2 className="animate-spin mr-2 h-5 w-5" />}
                                {isSignUp ? 'Sign Up' : 'Sign In'}
                            </button>
                        </div>
                    </form>
                    <p className="mt-6 text-center text-sm text-gray-300">
                        {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
                        <button onClick={() => setIsSignUp(!isSignUp)} className="font-medium text-indigo-400 hover:text-indigo-300">
                            {isSignUp ? 'Sign In' : 'Sign Up'}
                        </button>
                    </p>
                </div>
            </div>

            <div className="absolute bottom-4 text-center text-gray-400 text-xs z-20 animate-fade-in">
                <p className="font-bold">Powered by Aim Software</p>
                <p>Developed by Amit Sharma | Mob: 8875910376</p>
            </div>
        </div>
    );
};


// --- INITIAL STATE ---
const initialState = {
    students: [],
    feeStructure: { 'Full-time': 700, 'Half-time': 400 },
    seats: Array.from({ length: 50 }, (_, i) => ({ number: i + 1, gender: (i < 15 ? 'girl' : 'boy'), occupiedBy: null })),
};

// --- HELPER FUNCTIONS ---
const getTodayDate = () => { const today = new Date(); today.setHours(0, 0, 0, 0); return today; };
const debounce = (func, delay) => { let timeout; return (...args) => { clearTimeout(timeout); timeout = setTimeout(() => func.apply(this, args), delay); }; };

// --- MAIN APP COMPONENT ---
const App = () => {
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [libraryProfile, setLibraryProfile] = useState(null);
    const [activeView, setActiveView] = useState('dashboard');
    const [students, setStudents] = useState(initialState.students);
    const [feeStructure, setFeeStructure] = useState(initialState.feeStructure);
    const [seats, setSeats] = useState(initialState.seats);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalContent, setModalContent] = useState({ type: '', item: null });
    const [dashboardProfile, setDashboardProfile] = useState(null);

    const fetchLibraryProfile = useCallback(async (user) => {
        if (!user) return;
        try {
            const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single();
            if (error && error.code !== 'PGRST116') throw error;
            setLibraryProfile(data);
        } catch (error) { console.error("Error fetching library profile:", error.message); }
    }, []);

    const fetchStudents = useCallback(async (user) => {
        if (!user) return;
        try {
            const { data, error } = await supabase.from('students').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
            if (error) throw error;
            setStudents(data || []);
        } catch (error) { console.error("Error fetching students:", error.message); }
    }, []);

    useEffect(() => {
        setLoading(true);
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            if (session?.user) {
                Promise.all([fetchLibraryProfile(session.user), fetchStudents(session.user)]).finally(() => setLoading(false));
            } else {
                setLoading(false);
            }
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
            setSession(newSession);
            if (newSession?.user) {
                setLoading(true);
                Promise.all([fetchLibraryProfile(newSession.user), fetchStudents(newSession.user)]).finally(() => setLoading(false));
            } else {
                setLibraryProfile(null);
            }
        });
        return () => subscription.unsubscribe();
    }, [fetchLibraryProfile, fetchStudents]);

    useEffect(() => {
        setSeats(prevSeats => prevSeats.map(seat => ({ ...seat, occupiedBy: students.find(s => s.status === 'active' && s.seat_number === seat.number)?.student_id || null })));
    }, [students]);

    const runAction = async (action) => {
        setIsSubmitting(true);
        try { await action(); }
        catch (error) { alert(`Operation failed: ${error.message}`); console.error("Operation failed:", error); }
        finally { setIsSubmitting(false); }
    };

    const saveLibraryProfile = (profileData, logoFile) => runAction(async () => {
        if (!session) throw new Error("You must be logged in.");
        let logo_url = libraryProfile?.logo_url || '';

        if (logoFile) {
            const fileExt = logoFile.name.split('.').pop();
            const fileName = `${session.user.id}/logo.${fileExt}`;
            const { error: uploadError } = await supabase.storage.from('library-logos').upload(fileName, logoFile, { upsert: true });
            if (uploadError) throw new Error(`Logo Upload Failed: ${uploadError.message}`);
            const { data } = supabase.storage.from('library-logos').getPublicUrl(fileName);
            logo_url = data.publicUrl;
        }

        const updates = { id: session.user.id, ...profileData, logo_url, updated_at: new Date() };
        const { error } = await supabase.from('profiles').upsert(updates);
        if (error) throw error;
        setLibraryProfile(prev => ({ ...prev, ...updates }));
        alert('Library profile saved successfully!');
    });

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        setSession(null);
        setLibraryProfile(null);
    };

    const addStudent = (studentData, photoFile) => runAction(async () => {
        if (!session || !libraryProfile) throw new Error("You must be logged in and have a library profile.");
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
        const student_id = `${nextNumericId}`;
        const fee_amount = feeStructure[studentData.admissionType];
        
        const admissionDateObj = new Date(studentData.admissionDate);
        const initialDueDate = new Date(admissionDateObj);
        initialDueDate.setDate(initialDueDate.getDate() - 1);

        const newStudent = {
            user_id: session.user.id,
            student_id,
            title: studentData.title,
            name: studentData.name,
            father_name: studentData.fatherName,
            mobile: studentData.mobile,
            admission_type: studentData.admissionType,
            shift: studentData.shift,
            seat_number: studentData.seatNumber,
            photo_url,
            admission_date: studentData.admissionDate,
            next_due_date: initialDueDate.toISOString().split('T')[0],
            fee_amount,
            library_name: libraryProfile.library_name,
            library_reg_no: libraryProfile.reg_no,
            payment_history: [],
        };
        const { error: insertError } = await supabase.from('students').insert(newStudent);
        if (insertError) throw new Error(`Could not save student: ${insertError.message}`);
        await fetchStudents(session.user);
        handleCloseModal();
        alert('Student added successfully!');
    });

    const editStudent = (studentDBId, updatedData) => runAction(async () => {
        const { error } = await supabase.from('students').update(updatedData).eq('id', studentDBId);
        if (error) throw error;
        await fetchStudents(session.user);
        handleCloseModal();
        alert('Student updated successfully!');
    });

    const deleteStudent = (student) => runAction(async () => {
        if (student.photo_url) {
            const photoPath = student.photo_url.split('/student-photos/')[1];
            if (photoPath) await supabase.storage.from('student-photos').remove([photoPath]);
        }
        const { error } = await supabase.from('students').delete().eq('id', student.id);
        if (error) throw error;
        await fetchStudents(session.user);
        handleCloseModal();
        alert(`${student.name} was deleted successfully.`);
    });

    const handleFeePayment = (studentId, paymentDetails, months) => runAction(async () => {
        const student = students.find(s => s.id === studentId);
        if (!student) throw new Error("Student not found.");
        
        const newHistory = [...(student.payment_history || [])];
        let currentDueDate = new Date(student.next_due_date);

        for(let i = 0; i < months; i++) {
            newHistory.push({
                date: new Date().toISOString().split('T')[0],
                amount: paymentDetails.amount,
                method: paymentDetails.method
            });
            currentDueDate.setMonth(currentDueDate.getMonth() + 1);
        }

        const { error } = await supabase.from('students').update({ payment_history: newHistory, next_due_date: currentDueDate.toISOString().split('T')[0] }).eq('id', studentId);
        if (error) throw error;
        await fetchStudents(session.user);
        handleCloseModal();
        alert(`Payment confirmed for ${months} month(s)!`);
    });

    const handleMarkAsDue = (studentId) => runAction(async () => {
        const student = students.find(s => s.id === studentId);
        if (!student) throw new Error("Student not found.");
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const { error } = await supabase.from('students').update({ next_due_date: yesterday.toISOString().split('T')[0] }).eq('id', studentId);
        if (error) throw error;
        await fetchStudents(session.user);
        alert(`${student.name}'s fee has been marked as Due.`);
    });

    const handleStudentDeparture = (studentDBId, transferTargetDBId, reason) => runAction(async () => {
        const departingStudent = students.find(s => s.id === studentDBId);
        if (!departingStudent) throw new Error("Departing student not found.");

        const today = new Date();
        const nextDueDate = new Date(departingStudent.next_due_date);
        let remainingDays = nextDueDate > today ? Math.ceil((nextDueDate - today) / (1000 * 60 * 60 * 24)) : 0;
        let transferLog = null;

        if (transferTargetDBId) {
            const targetStudent = students.find(s => s.id === Number(transferTargetDBId));
            if (!targetStudent) throw new Error("Transfer target student not found.");
            transferLog = { transferredToId: targetStudent.student_id, transferredToName: targetStudent.name, daysTransferred: remainingDays };

            if (remainingDays > 0) {
                const targetDueDate = new Date(targetStudent.next_due_date);
                targetDueDate.setDate(targetDueDate.getDate() + remainingDays);
                const newCreditLog = { fromId: departingStudent.student_id, fromName: departingStudent.name, daysReceived: remainingDays, date: today.toISOString().split('T')[0] };
                const updatedCreditLog = [...(targetStudent.received_credit_log || []), newCreditLog];
                const { error: transferError } = await supabase.from('students').update({ next_due_date: targetDueDate.toISOString().split('T')[0], received_credit_log: updatedCreditLog }).eq('id', Number(transferTargetDBId));
                if (transferError) throw transferError;
            }
        }
        const { error: departError } = await supabase.from('students').update({ status: 'departed', departure_date: today.toISOString().split('T')[0], transfer_log: transferLog, departure_reason: reason }).eq('id', studentDBId);
        if (departError) throw departError;

        await fetchStudents(session.user);
        handleCloseModal();
        alert('Student departure recorded.');
    });

    const handleReactivateStudent = (studentId, newSeatNumber) => runAction(async () => {
        const student = students.find(s => s.id === studentId);
        if (!student) throw new Error("Student not found.");

        const updates = {
            status: 'active',
            seat_number: newSeatNumber,
            departure_date: null,
            departure_reason: null,
            transfer_log: null,
        };

        const { error } = await supabase.from('students').update(updates).eq('id', studentId);
        if (error) throw error;

        await fetchStudents(session.user);
        handleCloseModal();
        alert(`${student.name} has been reactivated successfully!`);
    });

    const handleDashboardSearch = (query) => {
        if (!query) { setDashboardProfile(null); return; }
        const lowerQuery = query.toLowerCase();
        const found = students.find(s => s.name.toLowerCase().includes(lowerQuery) || s.mobile?.includes(lowerQuery) || s.student_id.toLowerCase() === lowerQuery);
        setDashboardProfile(found || { notFound: true });
    };

    const handleOpenModal = useCallback((type, item = null) => { setModalContent({ type, item }); setIsModalOpen(true); }, []);
    const handleCloseModal = () => { if (!isSubmitting) { setIsModalOpen(false); setModalContent({ type: '', item: null }); } };

    const handleWhatsAppMessage = (student, type) => {
        if (!student.mobile) {
            alert("This student does not have a registered mobile number.");
            return;
        }

        let phoneNumber = student.mobile.replace(/\D/g, '');
        if (phoneNumber.length === 10) {
            phoneNumber = '91' + phoneNumber;
        }

        let message = '';
        if (type === 'due') {
            message = `Dear ${student.name} (s/o ${student.father_name}),\n\nThis is a friendly reminder from ${libraryProfile.library_name} that your monthly library fee is due. Your seat number is ${student.seat_number}.\n\nPlease pay the fee at your earliest convenience to continue using the library services.\n\nThank you.`;
        } else if (type === 'paid') {
            const lastPayment = student.payment_history && student.payment_history.length > 0 ? student.payment_history[student.payment_history.length - 1] : null;
            const amount = lastPayment ? lastPayment.amount : student.fee_amount;
            message = `Dear ${student.name} (s/o ${student.father_name}),\n\nThank you for your payment of ₹${amount} for your monthly subscription at ${libraryProfile.library_name}. Your fee is paid until ${new Date(student.next_due_date).toLocaleDateString()}.\n\nHappy studying!`;
        }

        const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
    };

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

    const renderView = () => {
        switch (activeView) {
            case 'dashboard': return <DashboardView stats={dashboardStats} activeStudents={activeStudents} onSearch={handleDashboardSearch} profile={dashboardProfile} onCardClick={(title, data) => handleOpenModal('listView', { title, data })} />;
            case 'seats': return <SeatMatrix seats={seats} onSeatClick={(seat) => handleOpenModal('addStudent', { seatNumber: seat.number, gender: seat.gender })} onViewStudent={(id) => { setActiveView('dashboard'); handleDashboardSearch(id); }} />;
            case 'students': return <StudentManagement students={students} onAddStudent={() => handleOpenModal('addStudent')} onDepart={(s) => handleOpenModal('departStudent', s)} onEdit={(s) => handleOpenModal('editStudent', s)} onDelete={(s) => handleOpenModal('deleteStudent', s)} onView={(id) => { setActiveView('dashboard'); handleDashboardSearch(id); }} />;
            case 'fees': return <FeeManagement students={students} onPayFee={(s) => handleOpenModal('feeProfile', s)} onMarkAsDue={handleMarkAsDue} onPrintReceipt={(s) => handleOpenModal('printReceipt', s)} onWhatsApp={handleWhatsAppMessage} onViewProfile={(s) => handleOpenModal('studentProfileDetail', s)} onReactivate={(s) => handleOpenModal('reactivateStudent', s)} />;
            case 'reports': return <ReportsView students={students} />;
            case 'departures': return <DeparturesView departedStudents={departedStudents} />;
            case 'settings': return <SettingsView feeStructure={feeStructure} onUpdate={setFeeStructure} />;
            default: return <DashboardView stats={dashboardStats} activeStudents={activeStudents} onSearch={handleDashboardSearch} profile={dashboardProfile} />;
        }
    };

    if (loading) return <SplashScreen />;
    if (!session) return <Auth />;
    if (session && !libraryProfile) {
        return <LibrarySetupForm onSave={saveLibraryProfile} isSubmitting={isSubmitting} onBack={handleSignOut} />;
    }

    return (
        <>
            <style>{`
                /* Custom Scrollbar Styles */
                .styled-scrollbar::-webkit-scrollbar {
                    width: 8px;
                    height: 8px;
                }
                .styled-scrollbar::-webkit-scrollbar-track {
                    background-color: #f0f0f0;
                    border-radius: 10px;
                }
                .styled-scrollbar::-webkit-scrollbar-thumb {
                    background-color: #c1c1c1;
                    border-radius: 10px;
                    border: 2px solid #f0f0f0;
                }
                .styled-scrollbar::-webkit-scrollbar-thumb:hover {
                    background-color: #a8a8a8;
                }
            `}</style>
            <div className="flex h-screen bg-gray-100 font-sans">
                <Sidebar setActiveView={setActiveView} activeView={activeView} onSignOut={handleSignOut} libraryName={libraryProfile?.library_name} />
                <main className="flex-1 flex flex-col overflow-hidden">
                    <Header userEmail={session.user.email} libraryName={libraryProfile?.library_name} />
                    <div className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-4 md:p-6 lg:p-8">
                        <div className="max-w-7xl mx-auto">{renderView()}</div>
                    </div>
                </main>
                {isModalOpen && <ModalRouter isSubmitting={isSubmitting} content={modalContent} onClose={handleCloseModal} students={students} seats={seats} feeStructure={feeStructure} onAddStudent={addStudent} onEditStudent={editStudent} onDeleteStudent={deleteStudent} onPayFee={handleFeePayment} onDepart={handleStudentDeparture} onReactivateStudent={handleReactivateStudent} libraryProfile={libraryProfile} onWhatsApp={handleWhatsAppMessage} />}
            </div>
        </>
    );
};

// --- LIBRARY SETUP FORM ---
const LibrarySetupForm = ({ onSave, isSubmitting, onBack }) => {
    const [profile, setProfile] = useState({ library_name: '', library_address: '', phone_numbers: '', reg_no: '' });
    const [logoFile, setLogoFile] = useState(null);
    const [logoPreview, setLogoPreview] = useState(null);
    const [validation, setValidation] = useState({ library_name: null, reg_no: null });

    const checkUniqueness = useCallback((field, value) => {
        if (!value) { setValidation(v => ({ ...v, [field]: null })); return; }
        setValidation(v => ({ ...v, [field]: 'checking' }));
        const check = async () => {
            const { data } = await supabase.from('profiles').select('id').eq(field, value).limit(1);
            setValidation(v => ({ ...v, [field]: data.length > 0 ? 'invalid' : 'valid' }));
        };
        check();
    }, []);

    const debouncedCheck = useMemo(() => debounce(checkUniqueness, 500), [checkUniqueness]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setProfile(p => ({ ...p, [name]: value }));
        if (name === 'library_name' || name === 'reg_no') {
            debouncedCheck(name, value);
        }
    };

    const handleLogoChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setLogoFile(file);
            setLogoPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (validation.library_name === 'invalid' || validation.reg_no === 'invalid') {
            alert("Please fix the errors before submitting.");
            return;
        }
        onSave(profile, logoFile);
    };

    const isSubmitDisabled = isSubmitting || validation.library_name === 'invalid' || validation.reg_no === 'invalid' || validation.library_name === 'checking' || validation.reg_no === 'checking';
    const renderValidationIcon = (status) => {
        if (status === 'checking') return <Loader2 className="h-5 w-5 animate-spin text-gray-400" />;
        if (status === 'valid') return <CheckCircle className="h-5 w-5 text-green-500" />;
        if (status === 'invalid') return <XCircle className="h-5 w-5 text-red-500" />;
        return null;
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4 transition-all duration-500">
            <div className="max-w-2xl w-full">
                <div className="text-center mb-8">
                    <BookOpen className="mx-auto h-12 w-auto text-indigo-600" />
                    <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Library Setup</h2>
                    <p className="mt-2 text-sm text-gray-600">Apni library ki details enter karke shuru karein.</p>
                </div>
                <div className="bg-white p-8 rounded-2xl shadow-lg">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="flex flex-col items-center space-y-4">
                            <label htmlFor="logo-upload" className="cursor-pointer">
                                <div className="w-28 h-28 rounded-full bg-gray-100 border-2 border-dashed flex items-center justify-center text-gray-400 hover:bg-gray-200 hover:border-indigo-500 transition">
                                    {logoPreview ? <img src={logoPreview} alt="Logo Preview" className="w-full h-full rounded-full object-cover" /> : <UploadCloud size={40} />}
                                </div>
                            </label>
                            <input id="logo-upload" type="file" className="hidden" accept="image/*" onChange={handleLogoChange} />
                            <p className="text-sm text-gray-500">Apna library logo upload karein</p>
                        </div>
                        <div className="relative">
                            <input name="library_name" value={profile.library_name} onChange={handleChange} required className="peer w-full p-3 pt-5 border border-gray-300 rounded-lg text-gray-900 placeholder-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500 transition" placeholder="Library Name" />
                            <label className="absolute left-3 -top-2.5 text-gray-600 text-sm transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-3.5 peer-focus:-top-2.5 peer-focus:text-sm peer-focus:text-indigo-600">Library Name</label>
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">{renderValidationIcon(validation.library_name)}</div>
                            {validation.library_name === 'invalid' && <p className="text-xs text-red-500 mt-1">Yeh naam pehle se use ho chuka hai.</p>}
                        </div>
                        <div className="relative">
                            <input name="library_address" value={profile.library_address} onChange={handleChange} required className="peer w-full p-3 pt-5 border border-gray-300 rounded-lg text-gray-900 placeholder-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500 transition" placeholder="Library Address" />
                            <label className="absolute left-3 -top-2.5 text-gray-600 text-sm transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-3.5 peer-focus:-top-2.5 peer-focus:text-sm peer-focus:text-indigo-600">Library Address</label>
                        </div>
                        <div className="relative">
                            <input name="phone_numbers" value={profile.phone_numbers} onChange={handleChange} required className="peer w-full p-3 pt-5 border border-gray-300 rounded-lg text-gray-900 placeholder-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500 transition" placeholder="Phone Number(s)" />
                            <label className="absolute left-3 -top-2.5 text-gray-600 text-sm transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-3.5 peer-focus:-top-2.5 peer-focus:text-sm peer-focus:text-indigo-600">Phone Number(s)</label>
                        </div>
                        <div className="relative">
                            <input name="reg_no" value={profile.reg_no} onChange={handleChange} className="peer w-full p-3 pt-5 border border-gray-300 rounded-lg text-gray-900 placeholder-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500 transition" placeholder="Library Reg. No. (Optional)" />
                            <label className="absolute left-3 -top-2.5 text-gray-600 text-sm transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-3.5 peer-focus:-top-2.5 peer-focus:text-sm peer-focus:text-indigo-600">Library Reg. No. (Optional)</label>
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">{renderValidationIcon(validation.reg_no)}</div>
                            {validation.reg_no === 'invalid' && <p className="text-xs text-red-500 mt-1">Yeh Reg. No. pehle se use ho chuka hai.</p>}
                        </div>
                        <button type="submit" disabled={isSubmitDisabled} className="w-full flex justify-center items-center bg-indigo-600 text-white p-3 font-bold tracking-wider rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed">
                            {isSubmitting && <Loader2 className="animate-spin mr-2 h-5 w-5" />}
                            {isSubmitting ? 'Saving...' : 'Save and Continue'}
                        </button>
                    </form>
                </div>
                <div className="text-center mt-6">
                    <button onClick={onBack} className="text-sm text-indigo-600 hover:text-indigo-500 font-medium flex items-center justify-center mx-auto">
                        <ArrowLeft size={16} className="mr-1" /> Logout & Go Back
                    </button>
                </div>
            </div>
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
            case 'deleteStudent': return <ConfirmationModal item={item} onConfirm={props.onDeleteStudent} text={`Are you sure you want to permanently delete ${item.name}?`} title="Confirm Deletion" confirmText="Delete" isSubmitting={isSubmitting} {...props} />;
            case 'feeProfile': return <StudentFeeProfile student={item} onPay={props.onPayFee} isSubmitting={isSubmitting} {...props} />;
            case 'departStudent': return <DepartStudentForm student={item} onConfirm={props.onDepart} isSubmitting={isSubmitting} {...props} />;
            case 'reactivateStudent': return <ReactivateStudentForm student={item} onConfirm={props.onReactivateStudent} isSubmitting={isSubmitting} {...props} />;
            case 'listView': return <ListViewModal title={item.title} data={item.data} onWhatsApp={props.onWhatsApp} {...props} />;
            case 'printReceipt': return <PrintReceiptModal student={item} libraryProfile={props.libraryProfile} />;
            case 'studentProfileDetail': return <StudentProfileDetailModal student={item} {...props} />;
            default: return null;
        }
    };
    return <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4"><div className={`bg-white p-6 md:p-8 rounded-lg shadow-2xl w-full ${
        type === 'printReceipt' || type === 'studentProfileDetail' 
            ? 'max-w-md md:max-w-2xl lg:max-w-3xl' // Responsive width for large modals
            : 'max-w-sm md:max-w-md lg:max-w-lg' // Responsive width for standard modals
    } relative max-h-[90vh] overflow-y-auto animate-fade-in-up styled-scrollbar`}><button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 disabled:opacity-50" disabled={isSubmitting}><X size={24} /></button>{renderModal()}</div></div>;
};

// --- UI & VIEW COMPONENTS ---
const SplashScreen = () => ( <div className="flex h-screen w-full items-center justify-center bg-indigo-600"><div className="text-center text-white animate-pulse"><BookOpen size={80} className="mx-auto mb-4" /><h1 className="text-5xl font-bold tracking-wider">Library MS</h1></div></div> );
const Header = ({ userEmail, libraryName }) => ( <header className="bg-white shadow-sm p-4 flex justify-between items-center"><h2 className="text-2xl font-semibold text-gray-700">{libraryName || 'Library Management'}</h2><div className="text-sm text-gray-600 hidden sm:block">{userEmail}</div></header> );
const Sidebar = ({ setActiveView, activeView, onSignOut, libraryName }) => {
    const navItems = [ 
        { id: 'dashboard', icon: <User size={20} />, label: 'Dashboard' }, 
        { id: 'seats', icon: <Armchair size={20} />, label: 'Seat Matrix' }, 
        { id: 'students', icon: <Users size={20} />, label: 'Students' }, 
        { id: 'fees', icon: <DollarSign size={20} />, label: 'Fees' }, 
        { id: 'reports', icon: <BookMarked size={20} />, label: 'Reports' },
        { id: 'departures', icon: <History size={20} />, label: 'Departures' }, 
        { id: 'settings', icon: <Settings size={20} />, label: 'Settings' }, 
    ];
    return ( <nav className="w-16 md:w-64 bg-white text-gray-800 shadow-lg flex flex-col"><div className="flex items-center justify-center md:justify-start p-4 border-b"><BookOpen className="text-indigo-600 h-8 w-8" /><h1 className="hidden md:block ml-3 text-xl font-bold text-indigo-600 truncate">{libraryName || 'Library'}</h1></div><ul className="mt-6 flex-1">{navItems.map(item => (<li key={item.id} className="px-4"><button type="button" onClick={() => setActiveView(item.id)} className={`w-full text-left flex items-center p-3 my-2 rounded-lg transition-colors duration-200 ${activeView === item.id ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-600 hover:bg-indigo-100 hover:text-indigo-600'}`}>{item.icon}<span className="hidden md:block ml-4 font-medium">{item.label}</span></button></li>))}</ul><div className="p-4 border-t"><button onClick={onSignOut} className="flex items-center p-3 w-full rounded-lg transition-colors duration-200 text-red-500 hover:bg-red-100"><LogOut size={20} /><span className="hidden md:block ml-4 font-medium">Sign Out</span></button></div></nav> );
};
const DashboardView = ({ stats, activeStudents, onSearch, profile, onCardClick }) => ( <div className="space-y-6"><div className="bg-white p-6 rounded-lg shadow-md"><h3 className="text-2xl font-semibold text-gray-800 mb-4">Find Student Profile</h3><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input type="text" placeholder="Search by Name, Mobile, or Reg. No..." className="w-full p-3 pl-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" onChange={(e) => onSearch(e.target.value)} /></div></div>{profile ? <StudentProfileCard student={profile} /> : (<><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"><StatCard label="Active Students" value={stats.totalStudents} color="purple" icon={<Users />} onClick={() => onCardClick('Active Students', activeStudents)} /><StatCard label="Seats Occupied" value={stats.seatsOccupied} color="teal" icon={<Armchair />} /><StatCard label="Pending Fees" value={`₹${stats.totalFeesPending}`} color="yellow" icon={<DollarSign />} onClick={() => onCardClick('Students with Pending Fees', stats.feesPendingList)} /><StatCard label="Fee Alerts" value={stats.feesPendingList.length} color="red" icon={<AlertTriangle />} onClick={() => onCardClick('Students with Fee Alerts', stats.feesPendingList)} /></div><DashboardCharts students={activeStudents} /></>)}</div> );
const StatCard = ({ label, value, color, icon, onClick }) => ( <div className={`bg-white p-6 rounded-xl shadow-md flex items-center justify-between border-l-4 border-${color}-500 ${onClick ? 'cursor-pointer hover:shadow-lg hover:scale-105 transition-all' : ''}`} onClick={onClick}><div><p className="text-sm font-medium text-gray-500 uppercase">{label}</p><p className="text-3xl font-bold text-gray-800">{value}</p></div><div className={`p-3 rounded-full bg-${color}-100 text-${color}-500`}>{icon}</div></div> );
const StudentProfileCard = ({ student }) => {
    if (student.notFound) { return ( <div className="bg-white p-6 rounded-lg shadow-xl text-center"><h3 className="text-2xl font-bold text-gray-800">Student Not Found</h3><p className="text-gray-500">No student matches your search query.</p></div> ); }
    const isFeeDue = new Date(student.next_due_date) < getTodayDate();
    return ( <div className="bg-white p-6 rounded-lg shadow-xl animate-fade-in"><div className="flex flex-col sm:flex-row items-center gap-6"><img src={student.photo_url || 'https://placehold.co/128x128/e2e8f0/64748b?text=Photo'} alt={student.name} className="w-32 h-32 rounded-full object-cover border-4 border-indigo-200" /><div className="flex-1 text-center sm:text-left"><h2 className="text-3xl font-bold text-gray-800">{student.title} {student.name}</h2><p className="text-indigo-600 font-mono">Reg. No: {student.student_id}</p><div className="flex items-center justify-center sm:justify-start gap-4 mt-2 text-gray-600"><span className="flex items-center gap-1"><Phone size={16} /> {student.mobile}</span><span className="flex items-center gap-1"><Armchair size={16} /> Seat {student.seat_number}</span></div></div><div className={`p-4 rounded-lg text-center ${isFeeDue ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}><p className="font-bold text-lg">{isFeeDue ? 'Fee Due' : 'Fee Paid'}</p><p className="text-sm">Next Due: {new Date(student.next_due_date).toLocaleDateString()}</p></div></div></div> );
};
const SeatMatrix = ({ seats, onSeatClick, onViewStudent }) => ( <div className="bg-white p-6 rounded-lg shadow-md"><h3 className="text-2xl font-semibold text-gray-800 mb-4">Seat Matrix</h3><div className="flex items-center space-x-4 mb-6"><div className="flex items-center"><div className="w-4 h-4 bg-pink-200 border border-pink-400 rounded-sm mr-2"></div><span>Girls' Seats</span></div><div className="flex items-center"><div className="w-4 h-4 bg-blue-200 border border-blue-400 rounded-sm mr-2"></div><span>Boys' Seats</span></div><div className="flex items-center"><div className="w-4 h-4 bg-gray-400 border border-gray-600 rounded-sm mr-2"></div><span>Occupied</span></div></div><div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">{seats.map(seat => { const isOccupied = !!seat.occupiedBy; const bgColor = isOccupied ? 'bg-gray-400' : (seat.gender === 'girl' ? 'bg-pink-200' : 'bg-blue-200'); const borderColor = isOccupied ? 'border-gray-600' : (seat.gender === 'girl' ? 'border-pink-400' : 'border-blue-400'); const textColor = isOccupied ? 'text-white' : 'text-gray-700'; const hoverEffect = !isOccupied ? 'hover:bg-green-300 hover:border-green-500' : 'hover:scale-105'; return (<div key={seat.number} className={`relative group w-full aspect-square flex flex-col items-center justify-center border rounded-md cursor-pointer ${bgColor} ${borderColor} ${textColor} transition-all duration-200 ${hoverEffect}`} onClick={() => isOccupied ? onViewStudent(seat.occupiedBy) : onSeatClick(seat)}><span className="font-bold text-lg">{seat.number}</span>{isOccupied && <User size={16} className="mt-1" />}</div>); })}</div></div> );

const StudentManagement = ({ students, onAddStudent, onView, onEdit, onDelete, onDepart }) => {
    const [filter, setFilter] = useState('active');

    const filteredStudents = useMemo(() => {
        return students.filter(s => s.status === filter);
    }, [students, filter]);

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 border-b pb-4 gap-4">
                <h3 className="text-2xl font-semibold text-gray-800">Student Management</h3>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
                        <button onClick={() => setFilter('active')} className={`px-4 py-1 rounded-md text-sm font-semibold transition ${filter === 'active' ? 'bg-indigo-600 text-white shadow' : 'text-gray-600 hover:bg-gray-200'}`}>Active</button>
                        <button onClick={() => setFilter('departed')} className={`px-4 py-1 rounded-md text-sm font-semibold transition ${filter === 'departed' ? 'bg-red-600 text-white shadow' : 'text-gray-600 hover:bg-gray-200'}`}>Departed</button>
                    </div>
                    <button onClick={onAddStudent} className="flex items-center bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"><Plus size={20} className="mr-2" /> Add Student</button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredStudents.length > 0 ? filteredStudents.map(s => (
                    <div key={s.id} className="bg-white border rounded-lg shadow-sm hover:shadow-lg transition-shadow duration-300 flex flex-col">
                        <div className="p-4 flex-grow">
                            <div className="flex items-start gap-4">
                                <img src={s.photo_url || 'https://placehold.co/128x128/e2e8f0/64748b?text=Photo'} alt={s.name} className="w-20 h-20 rounded-full object-cover border-2 border-gray-200" />
                                <div className="flex-1">
                                    <h4 className="font-bold text-lg text-gray-800">{s.title} {s.name}</h4>
                                    <p className="text-sm text-indigo-600 font-mono">Reg: {s.student_id}</p>
                                    <p className="text-sm text-gray-500 flex items-center gap-1 mt-1"><Phone size={14} />{s.mobile}</p>
                                    <p className="text-sm text-gray-500 flex items-center gap-1"><Armchair size={14} />Seat {s.seat_number}</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-gray-50 p-3 border-t">
                             <div className="flex justify-end gap-2 flex-wrap">
                                <button onClick={() => onView(s.student_id)} className="p-2 rounded-md bg-blue-100 text-blue-600 hover:bg-blue-200" title="View Profile"><Eye size={16}/></button>
                                {filter === 'active' && (
                                    <>
                                        <button onClick={() => onEdit(s)} className="p-2 rounded-md bg-yellow-100 text-yellow-600 hover:bg-yellow-200" title="Edit Student"><Edit size={16}/></button>
                                        <button onClick={() => onDelete(s)} className="p-2 rounded-md bg-red-100 text-red-600 hover:bg-red-200" title="Delete Student"><Trash2 size={16}/></button>
                                        <button onClick={() => onDepart(s)} className="p-2 rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300" title="Depart Student"><UserX size={16}/></button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )) : (
                    <div className="col-span-1 md:col-span-2 lg:col-span-3 text-center py-12 text-gray-500">
                        <p>No {filter} students found.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

const FeeManagement = ({ students, onPayFee, onMarkAsDue, onPrintReceipt, onWhatsApp, onViewProfile, onReactivate }) => {
    const initialFilters = {
        searchQuery: '',
        dateRange: { from: '', to: '' },
        feeStatus: 'all',
        shiftType: 'all',
        studentStatus: 'all', // Show all students by default
        dateFilterType: 'next_due_date',
    };
    const [filters, setFilters] = useState(initialFilters);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleDateChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({
            ...prev,
            dateRange: { ...prev.dateRange, [name]: value }
        }));
    };

    const resetFilters = () => {
        setFilters(initialFilters);
    };

    const filteredStudents = useMemo(() => {
        return students.filter(s => {
            if (filters.studentStatus !== 'all' && s.status !== filters.studentStatus) return false;
            
            const query = filters.searchQuery.toLowerCase();
            if (query && !s.name.toLowerCase().includes(query) && !s.mobile?.includes(query) && !s.student_id.includes(query)) {
                return false;
            }

            const isDue = new Date(s.next_due_date) < getTodayDate();
            if (filters.feeStatus === 'due' && !isDue) return false;
            if (filters.feeStatus === 'paid' && isDue) return false;

            if (filters.shiftType !== 'all' && s.admission_type !== filters.shiftType) return false;

            const fromDate = filters.dateRange.from ? new Date(filters.dateRange.from) : null;
            const toDate = filters.dateRange.to ? new Date(filters.dateRange.to) : null;
            
            if(fromDate || toDate) {
                const studentDate = new Date(s[filters.dateFilterType]);
                if (fromDate && studentDate < fromDate) return false;
                if (toDate) {
                    const endOfDay = new Date(toDate);
                    endOfDay.setHours(23, 59, 59, 999);
                    if (studentDate > endOfDay) return false;
                }
            }
            
            return true;
        });
    }, [students, filters]);

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex flex-wrap justify-between items-center gap-4 mb-6 border-b pb-4">
                    <h3 className="text-2xl font-semibold text-gray-800">Fee Dashboard</h3>
                    <Button onClick={resetFilters} className="bg-gray-200 text-gray-700 hover:bg-gray-300">
                        <FilterX size={16} className="mr-2"/> Reset Filters
                    </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="lg:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Search Student</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input 
                                type="text"
                                name="searchQuery"
                                value={filters.searchQuery}
                                onChange={handleFilterChange}
                                placeholder="Search by Name, Mobile, or Reg. No..." 
                                className="w-full p-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                            />
                        </div>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Fee Status</label>
                        <select name="feeStatus" value={filters.feeStatus} onChange={handleFilterChange} className="w-full p-2 border border-gray-300 rounded-lg bg-white">
                            <option value="all">All Fee Status</option>
                            <option value="paid">Paid</option>
                            <option value="due">Due</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Student Status</label>
                        <select name="studentStatus" value={filters.studentStatus} onChange={handleFilterChange} className="w-full p-2 border border-gray-300 rounded-lg bg-white">
                            <option value="all">All Students</option>
                            <option value="active">Active</option>
                            <option value="departed">Inactive</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
                <h4 className="text-lg font-semibold text-gray-700 mb-4">
                    Student Fee Status <span className="text-indigo-600 font-bold">({filteredStudents.length} students found)</span>
                </h4>
                <div className="overflow-auto max-h-[60vh] styled-scrollbar">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 sticky top-0 z-10"><tr className="border-b"><th className="p-3 text-sm font-semibold text-gray-600">Name</th><th className="p-3 text-sm font-semibold text-gray-600">Fee Status</th><th className="p-3 text-sm font-semibold text-gray-600">Fee Period</th><th className="p-3 text-sm font-semibold text-gray-600">Actions</th></tr></thead>
                        <tbody>
                            {filteredStudents.length > 0 ? filteredStudents.map(s => {
                                const isDue = new Date(s.next_due_date) < getTodayDate();
                                const toDate = new Date(s.next_due_date);
                                const fromDate = new Date(s.next_due_date);
                                fromDate.setMonth(fromDate.getMonth() - 1);

                                return (
                                    <tr key={s.id} className="border-b hover:bg-gray-50">
                                        <td className="p-3">
                                            <p className="font-medium text-gray-800">{s.name} {s.status === 'departed' && <span className="text-xs text-red-500 font-normal">(Inactive)</span>}</p>
                                            <p className="text-xs text-gray-500 font-mono">Reg: {s.student_id}</p>
                                        </td>
                                        <td className="p-3"><span className={`px-3 py-1 rounded-full text-xs font-semibold ${s.status === 'departed' ? 'bg-gray-200 text-gray-700' : isDue ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>{s.status === 'departed' ? 'Inactive' : isDue ? 'Due' : 'Paid'}</span></td>
                                        <td className="p-3 text-sm text-gray-600">
                                            {`${fromDate.toLocaleDateString()} to ${toDate.toLocaleDateString()}`}
                                        </td>
                                        <td className="p-3">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                {s.status === 'active' ? (
                                                    <>
                                                        <button onClick={() => onPayFee(s)} className="bg-blue-500 text-white px-3 py-1 text-xs rounded-md hover:bg-blue-600">Pay Fee</button>
                                                        {!isDue && (<button onClick={() => onMarkAsDue(s.id)} className="bg-yellow-500 text-white px-3 py-1 text-xs rounded-md hover:bg-yellow-600 flex items-center gap-1" title="Mark fee as due immediately"><AlertTriangle size={14} /> Mark Due</button>)}
                                                        <button onClick={() => onPrintReceipt(s)} className="bg-teal-500 text-white p-2 rounded-md hover:bg-teal-600 flex items-center gap-1" title="Print Receipt"><Printer size={14} /></button>
                                                        <button onClick={() => onWhatsApp(s, isDue ? 'due' : 'paid')} className="bg-green-500 text-white p-2 rounded-md hover:bg-green-600 flex items-center gap-1" title="Send WhatsApp Message"><MessageSquare size={14} /></button>
                                                    </>
                                                ) : (
                                                    <button onClick={() => onReactivate(s)} className="bg-green-600 text-white px-3 py-1 text-xs rounded-md hover:bg-green-700 flex items-center gap-1" title="Reactivate Student"><UserCheck size={14} /> Reactivate</button>
                                                )}
                                                <button onClick={() => onViewProfile(s)} className="bg-gray-500 text-white p-2 rounded-md hover:bg-gray-600 flex items-center gap-1" title="View Full Profile"><Eye size={14} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            }) : (
                                <tr>
                                    <td colSpan="4" className="text-center p-8 text-gray-500">
                                        No students match the current filters.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
const DeparturesView = ({ departedStudents }) => (
    <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-2xl font-semibold text-gray-800 mb-4">Departed Student History</h3>
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead><tr className="bg-gray-100"><th className="p-3">Name</th><th className="p-3">Departure Date</th><th className="p-3">Reason for Leaving</th><th className="p-3">Credit Transferred</th></tr></thead>
                <tbody>
                    {departedStudents.length > 0 ? departedStudents.map(s => (
                        <tr key={s.id} className="border-b hover:bg-gray-50">
                            <td className="p-3 font-medium">{s.name} (Reg: {s.student_id})</td>
                            <td className="p-3">{new Date(s.departure_date).toLocaleDateString()}</td>
                            <td className="p-3 text-sm text-gray-600">{s.departure_reason || <span className="text-gray-400">No reason given</span>}</td>
                            <td className="p-3">{s.transfer_log ? (<div><p className="font-medium">{s.transfer_log.transferredToName} <span className="font-normal text-green-700">({s.transfer_log.daysTransferred} days)</span></p><p className="text-xs text-gray-500 font-mono">Reg: {s.transfer_log.transferredToId}</p></div>) : (<span className="text-gray-500">N/A</span>)}</td>
                        </tr>
                    )) : <tr><td colSpan="4" className="text-center p-4 text-gray-500">No students have departed yet.</td></tr>}
                </tbody>
            </table>
        </div>
    </div>
);
const SettingsView = ({ feeStructure, onUpdate }) => {
    const [fees, setFees] = useState(feeStructure); const [saved, setSaved] = useState(false);
    const handleSave = () => { onUpdate(fees); setSaved(true); setTimeout(() => setSaved(false), 2000); };
    return (
        <div className="bg-white p-6 rounded-lg shadow-md max-w-md mx-auto">
            <h3 className="text-2xl font-semibold text-gray-800 mb-6">Fee Structure Settings</h3>
            <div className="space-y-4">
                <div><label htmlFor="full-time-fee" className="block text-sm font-medium text-gray-700 mb-1">Full-time Fee (₹)</label><input type="number" id="full-time-fee" value={fees['Full-time']} onChange={e => setFees({ ...fees, 'Full-time': Number(e.target.value) })} className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
                <div><label htmlFor="half-time-fee" className="block text-sm font-medium text-gray-700 mb-1">Half-time Fee (₹)</label><input type="number" id="half-time-fee" value={fees['Half-time']} onChange={e => setFees({ ...fees, 'Half-time': Number(e.target.value) })} className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
            </div>
            <button onClick={handleSave} className="w-full mt-6 bg-indigo-600 text-white p-3 rounded-lg hover:bg-indigo-700 transition duration-200 font-semibold flex items-center justify-center">{saved ? (<><CheckCircle size={20} className="mr-2" /> Saved!</>) : ('Save Changes')}</button>
        </div>
    );
};

// --- MODAL & FORM COMPONENTS ---
const Button = ({ children, ...props }) => <button {...props} className="flex items-center justify-center px-4 py-2 rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed">{props.disabled && <Loader2 className="animate-spin mr-2 h-5 w-5" />}{children}</button>;
const ConfirmationModal = ({ onConfirm, onClose, text, title, confirmText, item, isSubmitting }) => (<div><h3 className={`text-2xl font-semibold mb-2 ${confirmText === 'Delete' ? 'text-red-700' : 'text-gray-800'}`}>{title}</h3><p className="text-gray-600 mb-6">{text}</p><div className="flex justify-end gap-4"><button onClick={onClose} disabled={isSubmitting} className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 disabled:opacity-60">Cancel</button><Button onClick={() => onConfirm(item)} disabled={isSubmitting} className={confirmText === 'Delete' ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}>{isSubmitting ? `${confirmText}...` : confirmText}</Button></div></div>);
const AddStudentForm = ({ onAddStudent, seats, prefill, feeStructure, isSubmitting }) => {
    const [formData, setFormData] = useState({ title: prefill?.gender === 'girl' ? 'Ms.' : 'Mr.', name: '', fatherName: '', mobile: '', admissionType: 'Full-time', seatNumber: prefill?.seatNumber || '', admissionDate: new Date().toISOString().split('T')[0], shift: 'Morning' });
    const [photoFile, setPhotoFile] = useState(null); const [photoPreview, setPhotoPreview] = useState(null); const [error, setError] = useState('');
    const handleChange = (e) => { const { name, value } = e.target; setFormData(prev => ({ ...prev, [name]: value })); };
    const handlePhotoChange = (e) => { if (e.target.files && e.target.files[0]) { const file = e.target.files[0]; setPhotoFile(file); setPhotoPreview(URL.createObjectURL(file)); } };
    const handleSubmit = (e) => { 
        e.preventDefault(); 
        setError(''); 
        if (!photoFile) { setError('Photo is compulsory for admission.'); return; } 
        const finalData = { ...formData };
        if (finalData.admissionType === 'Full-time') {
            finalData.shift = null; // Set shift to null for Full-time students
        }
        onAddStudent(finalData, photoFile); 
    };
    const availableSeats = seats.filter(s => !s.occupiedBy && s.gender === (formData.title === 'Mr.' ? 'boy' : 'girl'));
    return ( <form onSubmit={handleSubmit} className="space-y-4"><h3 className="text-2xl font-semibold mb-6 text-gray-800">New Student Admission</h3><div className="flex items-center justify-center"><label htmlFor="photo-upload" className="cursor-pointer"><div className={`w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center border-2 border-dashed ${error ? 'border-red-500' : 'hover:border-indigo-500'}`}>{photoPreview ? <img src={photoPreview} alt="Preview" className="w-full h-full rounded-full object-cover"/> : <ImageIcon className="text-gray-400" size={40} />}</div></label><input id="photo-upload" type="file" className="hidden" accept="image/*" onChange={handlePhotoChange} /></div>{error && <p className="text-red-500 text-sm text-center">{error}</p>}<div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div><label>Title</label><select name="title" value={formData.title} onChange={handleChange} className="w-full p-2 border rounded-lg bg-white"><option>Mr.</option><option>Ms.</option></select></div><div><label>Full Name</label><input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full p-2 border rounded-lg" required /></div><div><label>Father/Husband Name</label><input type="text" name="fatherName" value={formData.fatherName} onChange={handleChange} className="w-full p-2 border rounded-lg" required /></div><div><label>Mobile</label><input type="tel" name="mobile" value={formData.mobile} onChange={handleChange} className="w-full p-2 border rounded-lg" required /></div><div><label>Admission Date</label><input type="date" name="admissionDate" value={formData.admissionDate} onChange={handleChange} className="w-full p-2 border rounded-lg" required /></div><div><label>Admission Type</label><select name="admissionType" value={formData.admissionType} onChange={handleChange} className="w-full p-2 border rounded-lg bg-white"><option value="Full-time">Full-time</option><option value="Half-time">Half-time</option></select></div>{formData.admissionType === 'Half-time' && (<div><label>Shift</label><select name="shift" value={formData.shift} onChange={handleChange} className="w-full p-2 border rounded-lg bg-white"><option value="Morning">Morning <Sun className="inline-block" size={16}/></option><option value="Evening">Evening <Moon className="inline-block" size={16}/></option></select></div>)}<div className={formData.admissionType === 'Half-time' ? '' : 'md:col-span-2'}><label>Assign Seat</label><select name="seatNumber" value={formData.seatNumber} onChange={e => setFormData({...formData, seatNumber: parseInt(e.target.value)})} className="w-full p-2 border rounded-lg bg-white" required disabled={!!prefill?.seatNumber}><option value="">Select a seat</option>{availableSeats.map(s => <option key={s.number} value={s.number}>Seat {s.number}</option>)}</select></div></div><div className="p-4 bg-indigo-50 rounded-lg text-center"><h4 className="font-semibold text-indigo-800">Fee for {formData.admissionType}: <span className="font-bold">₹{feeStructure[formData.admissionType]}</span></h4></div><Button type="submit" disabled={isSubmitting} className="w-full mt-6 bg-indigo-600 text-white p-3 hover:bg-indigo-700">{isSubmitting ? 'Saving...' : 'Confirm Admission'}</Button> </form> );
};
const EditStudentForm = ({ student, onEditStudent, isSubmitting }) => {
    const [formData, setFormData] = useState({ name: student.name, mobile: student.mobile, father_name: student.father_name });
    const handleSubmit = (e) => { e.preventDefault(); onEditStudent(student.id, formData); };
    return ( <form onSubmit={handleSubmit} className="space-y-4"><h3 className="text-2xl font-semibold mb-6 text-gray-800">Edit {student.name}</h3><div className="grid grid-cols-1 gap-4"><div><label>Full Name</label><input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-2 border rounded-lg" required /></div><div><label>Father/Husband Name</label><input type="text" value={formData.father_name} onChange={e => setFormData({...formData, father_name: e.target.value})} className="w-full p-2 border rounded-lg" required /></div><div><label>Mobile</label><input type="tel" value={formData.mobile} onChange={e => setFormData({...formData, mobile: e.target.value})} className="w-full p-2 border rounded-lg" required /></div></div><Button type="submit" disabled={isSubmitting} className="w-full mt-6 bg-indigo-600 text-white p-3 hover:bg-indigo-700">{isSubmitting ? 'Saving...' : 'Save Changes'}</Button></form> );
};
const StudentFeeProfile = ({ student, onPay, isSubmitting }) => {
    const [paymentMethod, setPaymentMethod] = useState('UPI');
    const [months, setMonths] = useState(1);
    const handleConfirmPayment = () => { onPay(student.id, { amount: student.fee_amount, method: paymentMethod }, months); };
    return ( <div><h3 className="text-2xl font-semibold mb-2 text-gray-800">{student.name}'s Fee Profile</h3><p className="text-gray-600 mb-4">Reg. No: {student.student_id} | Next Due: {new Date(student.next_due_date).toLocaleDateString()}</p><div className="mb-4"><h4 className="font-semibold text-gray-700 mb-2">Payment History</h4><div className="max-h-40 overflow-y-auto border rounded-lg p-2 bg-gray-50">{student.payment_history && student.payment_history.length > 0 ? student.payment_history.map((p, i) => ( <div key={i} className="flex justify-between items-center p-2 border-b"><p>{new Date(p.date).toLocaleDateString()}: <span className="font-bold">₹{p.amount}</span></p><span className="text-xs bg-gray-200 px-2 py-1 rounded-full">{p.method}</span></div> )) : <p className="text-center text-gray-500">No payments recorded.</p>}</div></div>{student.received_credit_log && student.received_credit_log.length > 0 && (<div className="mb-4"><h4 className="font-semibold text-gray-700 mb-2">Credit History</h4><div className="max-h-40 overflow-y-auto border rounded-lg p-2 bg-gray-50">{student.received_credit_log.map((log, i) => ( <div key={i} className="p-2 border-b text-sm">Received <strong>{log.daysReceived} days</strong> from {log.fromName} on {new Date(log.date).toLocaleDateString()}</div> ))}</div></div>)}<div><h4 className="font-semibold text-gray-700 mb-2">Receive New Payment</h4><div className="p-4 border rounded-lg"><p>Amount per month: <span className="font-bold text-xl">₹{student.fee_amount}</span></p><div className="my-2"><label className="block text-sm">Payment Method</label><select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className="w-full p-2 border rounded-lg bg-white"><option>UPI</option><option>Cash</option></select></div><div className="my-2"><label className="block text-sm">Pay for how many months?</label><input type="number" value={months} onChange={e => setMonths(Math.max(1, parseInt(e.target.value) || 1))} className="w-full p-2 border rounded-lg" min="1" /></div><div className="mt-2 font-bold text-lg">Total Amount: ₹{student.fee_amount * months}</div><Button onClick={handleConfirmPayment} disabled={isSubmitting} className="w-full mt-2 bg-green-600 text-white p-3 hover:bg-green-700">{isSubmitting ? 'Processing...' : 'Confirm Payment'}</Button></div></div></div> );
};
const DepartStudentForm = ({ student, students, onConfirm, isSubmitting }) => {
    const [transferTo, setTransferTo] = useState('');
    const [reason, setReason] = useState('');
    const today = new Date(); const nextDueDate = new Date(student.next_due_date); const remainingDays = nextDueDate > today ? Math.ceil((nextDueDate - today) / (1000 * 60 * 60 * 24)) : 0;
    return ( <div><h3 className="text-2xl font-semibold mb-2 text-red-700">Student Departure</h3><p className="mb-4">Confirm departure for <strong>{student.name}</strong> (Reg. No: {student.student_id})?</p><div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-4"><h4 className="font-semibold">Credit Calculation</h4><p>Remaining billable days: <span className="font-bold">{remainingDays}</span></p>{remainingDays > 0 && <p className="text-sm text-gray-600">You can transfer these days to another student.</p>}</div>{remainingDays > 0 && (<div className="mb-4"><label className="block text-sm font-medium">Transfer Remaining Days To (Optional)</label><select value={transferTo} onChange={e => setTransferTo(e.target.value)} className="w-full p-2 border rounded-lg bg-white"><option value="">Don't Transfer</option>{students.filter(s => s.id !== student.id && s.status === 'active').map(s => ( <option key={s.id} value={s.id}>{s.name} (Reg. No: {s.student_id})</option> ))}</select></div>)}<div className="mb-4"><label className="block text-sm font-medium">Reason for Leaving (Optional)</label><textarea value={reason} onChange={e => setReason(e.target.value)} className="w-full p-2 border rounded-lg" rows="3" placeholder="e.g., Course completed, Relocating..."></textarea></div><Button onClick={() => onConfirm(student.id, transferTo, reason)} disabled={isSubmitting} className="w-full mt-6 bg-red-600 text-white p-3 hover:bg-red-700">{isSubmitting ? 'Departing...' : 'Confirm Departure'}</Button></div> );
};
const ReactivateStudentForm = ({ student, seats, onConfirm, isSubmitting }) => {
    const [newSeatNumber, setNewSeatNumber] = useState('');
    const availableSeats = useMemo(() => seats.filter(s => !s.occupiedBy), [seats]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!newSeatNumber) {
            alert("Please select a new seat for the student.");
            return;
        }
        onConfirm(student.id, newSeatNumber);
    };

    return (
        <form onSubmit={handleSubmit}>
            <h3 className="text-2xl font-semibold mb-2 text-green-700">Reactivate Student</h3>
            <p className="mb-4">Reactivating <strong>{student.name}</strong> (Reg. No: {student.student_id}). Please assign a new seat.</p>
            
            <div className="mb-4">
                <label htmlFor="seat-select" className="block text-sm font-medium mb-1">Assign New Seat</label>
                <select 
                    id="seat-select"
                    value={newSeatNumber} 
                    onChange={e => setNewSeatNumber(e.target.value)} 
                    className="w-full p-2 border rounded-lg bg-white"
                    required
                >
                    <option value="">Select an available seat</option>
                    {availableSeats.map(s => (
                        <option key={s.number} value={s.number}>
                            Seat {s.number} ({s.gender.charAt(0).toUpperCase() + s.gender.slice(1)})
                        </option>
                    ))}
                </select>
            </div>

            <Button type="submit" disabled={isSubmitting || !newSeatNumber} className="w-full mt-6 bg-green-600 text-white p-3 hover:bg-green-700">
                {isSubmitting ? 'Reactivating...' : 'Confirm Reactivation'}
            </Button>
        </form>
    );
};
const ListViewModal = ({ title, data, onWhatsApp }) => {
    const showWhatsAppButton = onWhatsApp && title.includes('Fee Alerts');
    return (
        <div>
            <h3 className="text-2xl font-semibold mb-4 text-gray-800">{title}</h3>
            <div className="max-h-80 overflow-y-auto">
                <div className={`grid ${showWhatsAppButton ? 'grid-cols-4' : 'grid-cols-3'} items-center p-2 border-b bg-gray-50 font-semibold text-sm text-gray-600 sticky top-0`}>
                    <span>Student</span>
                    <span>Admission Date</span>
                    <span className="text-right">Next Due Date</span>
                    {showWhatsAppButton && <span className="text-right">Action</span>}
                </div>
                {data.length > 0 ? data.map(s => (
                    <div key={s.id} className={`grid ${showWhatsAppButton ? 'grid-cols-4' : 'grid-cols-3'} items-center p-2 border-b`}>
                        <div>
                            <p className="font-medium">{s.name}</p>
                            <p className="text-sm text-gray-500">Reg: {s.student_id}</p>
                        </div>
                        <div className="text-sm text-gray-600">
                            <p>{new Date(s.admission_date).toLocaleDateString()}</p>
                        </div>
                        <div className="text-sm text-gray-600 text-right">
                            <p>{new Date(s.next_due_date).toLocaleDateString()}</p>
                        </div>
                        {showWhatsAppButton && (
                            <div className="text-right">
                                <button onClick={() => onWhatsApp(s, 'due')} className="p-2 rounded-md bg-green-100 text-green-600 hover:bg-green-200" title="Send WhatsApp Reminder">
                                    <MessageSquare size={16}/>
                                </button>
                            </div>
                        )}
                    </div>
                )) : <p className="text-center text-gray-500 p-4">No students to display.</p>}
            </div>
        </div>
    );
};

// --- REVAMPED FEE RECEIPT ---
const FeeReceipt = React.forwardRef(({ student, libraryProfile, payment }, ref) => {
    const paymentDate = new Date(payment.date);
    
    const toDate = new Date(student.next_due_date);
    toDate.setDate(toDate.getDate() - 1);
    const fromDate = new Date(toDate);
    fromDate.setMonth(fromDate.getMonth() - 1);
    fromDate.setDate(fromDate.getDate() + 1);

    const receiptNo = `${student.student_id}-${paymentDate.getFullYear()}${(paymentDate.getMonth() + 1).toString().padStart(2, '0')}`;
    
    const numberToWords = (num) => {
        const a = ['','one ','two ','three ','four ', 'five ','six ','seven ','eight ','nine ','ten ','eleven ','twelve ','thirteen ','fourteen ','fifteen ','sixteen ','seventeen ','eighteen ','nineteen '];
        const b = ['', '', 'twenty','thirty','forty','fifty', 'sixty','seventy','eighty','ninety'];
        
        if ((num = num.toString()).length > 9) return 'overflow';
        let number = parseInt(num);
        if (number === 0) return 'Zero Only';

        let str = '';
        if (number >= 1000) {
            str += a[Math.floor(number / 1000)] + 'thousand ';
            number %= 1000;
        }
        if (number >= 100) {
            str += a[Math.floor(number / 100)] + 'hundred ';
            number %= 100;
        }
        if (number > 0) {
            if (str !== '') str += 'and ';
            if (number < 20) {
                str += a[number];
            } else {
                str += b[Math.floor(number / 10)] + a[number % 10];
            }
        }
        
        return str.trim().split(' ').map(s => s.charAt(0).toUpperCase() + s.substring(1)).join(' ') + ' Only';
    };
    
    return(
        <div ref={ref} className="p-2 bg-white text-gray-900">
            <style type="text/css" media="print">
                {`
                    @import url('https://fonts.googleapis.com/css2?family=Roboto+Slab:wght@400;700&display=swap');
                    @page { size: A5; margin: 0; }
                    body { -webkit-print-color-adjust: exact; font-family: 'Roboto Slab', serif; }
                    .no-print { display: none; }
                    .receipt-container { border: 2px solid #000 !important; }
                `}
            </style>
            <div className="receipt-container border-2 border-dashed border-gray-400 p-4 font-['Roboto_Slab']">
                <header className="text-center mb-4">
                    {libraryProfile?.logo_url && <img src={libraryProfile.logo_url} alt="Logo" className="h-20 w-20 mx-auto object-contain mb-2"/>}
                    <h1 className="text-3xl font-bold uppercase tracking-wider">{libraryProfile?.library_name || 'Library Name'}</h1>
                    <p className="text-xs">{libraryProfile?.library_address || 'Address not set'}</p>
                    <div className="text-xs flex justify-center gap-4">
                        <span>Ph: {libraryProfile?.phone_numbers || 'Not set'}</span>
                        {libraryProfile?.reg_no && <span>Reg.No: {libraryProfile.reg_no}</span>}
                    </div>
                </header>

                <div className="flex justify-between items-start text-sm border-t-2 border-b-2 border-black py-1 my-2">
                    <div><span className="font-bold">Receipt No:</span> {receiptNo}</div>
                    <div><span className="font-bold">Date:</span> {paymentDate.toLocaleDateString('en-GB')}</div>
                </div>

                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm mb-2">
                    <div className="col-span-2"><span className="font-bold pr-2">Name Of Student:</span>{student.name}</div>
                    <div className="col-span-2"><span className="font-bold pr-2">Father's/Husband Name:</span>{student.father_name}</div>
                    <div><span className="font-bold pr-2">Reg. No:</span>{student.student_id}</div>
                    <div><span className="font-bold pr-2">Mob:</span>{student.mobile}</div>
                    <div className="col-span-2">
                        <span className="font-bold pr-2">Fee for Period:</span>
                        {fromDate.toLocaleDateString('en-GB')} To {toDate.toLocaleDateString('en-GB')}
                    </div>
                    <div>
                        <span className="font-bold pr-2">Shift:</span>
                        {student.admission_type === 'Full-time' ? 'Full Day' : student.shift}
                    </div>
                </div>

                <div className="border-t-2 border-black pt-2">
                    <div className="flex justify-between items-center text-sm">
                        <p className="font-bold">The Sum of Rupee:</p>
                        <div className="border-2 border-black px-4 py-1 font-bold">₹ {payment.amount.toFixed(2)} /-</div>
                    </div>
                    <p className="text-sm capitalize font-semibold mt-1">{numberToWords(payment.amount)}</p>
                </div>
                
                <div className="flex justify-between items-end mt-10">
                    <p className="text-xs text-gray-700">Note: Fee is not Refundable/Transferable.</p>
                    <div className="text-center">
                        <div className="border-b-2 border-gray-600 border-dotted w-40 mb-1"></div>
                        <p className="text-xs font-bold">Authorized Signature</p>
                    </div>
                </div>
            </div>
        </div>
    );
});
const PrintReceiptModal = ({ student, libraryProfile }) => {
    const receiptRef = useRef();
    const lastPayment = student.payment_history && student.payment_history.length > 0 ? student.payment_history[student.payment_history.length - 1] : null;
    
    if (!lastPayment) {
        return (
            <div>
                <h3 className="text-2xl font-semibold mb-4 text-gray-800">Print Fee Receipt</h3>
                <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4" role="alert">
                    <p className="font-bold">No Payment History</p>
                    <p>This student has not made any payments yet. No receipt can be generated.</p>
                </div>
            </div>
        );
    }

    const handlePrint = () => {
        const printContents = receiptRef.current.innerHTML;
        const originalContents = document.body.innerHTML;
        document.body.innerHTML = printContents;
        window.print();
        document.body.innerHTML = originalContents;
        window.location.reload();
    };

    return(
        <div>
            <h3 className="text-2xl font-semibold mb-4 text-gray-800">Print Fee Receipt</h3>
            <FeeReceipt ref={receiptRef} student={student} libraryProfile={libraryProfile} payment={lastPayment} />
            <Button onClick={handlePrint} className="w-full mt-6 bg-indigo-600 text-white p-3 hover:bg-indigo-700 no-print">
                <Printer size={20} className="mr-2"/> Print Receipt
            </Button>
        </div>
    );
};

// --- NEW DASHBOARD CHARTS COMPONENT ---
const DashboardCharts = ({ students }) => {
    const monthlyAdmissionsData = useMemo(() => {
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const admissions = {};
        
        // Initialize last 6 months
        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            const monthKey = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
            admissions[monthKey] = 0;
        }

        students.forEach(student => {
            const admissionDate = new Date(student.admission_date);
            const monthKey = `${monthNames[admissionDate.getMonth()]} ${admissionDate.getFullYear()}`;
            if (admissions.hasOwnProperty(monthKey)) {
                admissions[monthKey]++;
            }
        });

        return Object.keys(admissions).map(key => ({
            month: key,
            Admissions: admissions[key]
        }));
    }, [students]);

    const feeStatusData = useMemo(() => {
        let paid = 0;
        let due = 0;
        const today = getTodayDate();
        students.forEach(s => {
            if (new Date(s.next_due_date) < today) {
                due++;
            } else {
                paid++;
            }
        });
        return [{ name: 'Paid', value: paid }, { name: 'Due', value: due }];
    }, [students]);

    const COLORS = ['#0088FE', '#FF8042'];

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
            <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md">
                <h4 className="text-lg font-semibold text-gray-700 mb-4">Monthly Admissions</h4>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={monthlyAdmissionsData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="Admissions" fill="#8884d8" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h4 className="text-lg font-semibold text-gray-700 mb-4">Fee Status Overview</h4>
                <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                        <Pie
                            data={feeStatusData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                            {feeStatusData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};


// --- REPORTS VIEW ---
const ReportsView = ({ students }) => {
    const initialFilters = {
        dateRange: { from: '', to: '' },
        feeStatus: 'all',
        shiftType: 'all',
        studentStatus: 'active',
        dateFilterType: 'admission_date',
    };
    const [filters, setFilters] = useState(initialFilters);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleDateChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({
            ...prev,
            dateRange: { ...prev.dateRange, [name]: value }
        }));
    };

    const resetFilters = () => {
        setFilters(initialFilters);
    };

    const filteredStudents = useMemo(() => {
        return students.filter(s => {
            if (filters.studentStatus !== 'all' && s.status !== filters.studentStatus) return false;
            
            const isDue = new Date(s.next_due_date) < getTodayDate();
            if (filters.feeStatus === 'due' && !isDue) return false;
            if (filters.feeStatus === 'paid' && isDue) return false;

            if (filters.shiftType !== 'all' && s.admission_type !== filters.shiftType) return false;

            const fromDate = filters.dateRange.from ? new Date(filters.dateRange.from) : null;
            const toDate = filters.dateRange.to ? new Date(filters.dateRange.to) : null;
            
            if(fromDate || toDate) {
                const studentDate = new Date(s[filters.dateFilterType]);
                if (fromDate && studentDate < fromDate) return false;
                if (toDate) {
                    const endOfDay = new Date(toDate);
                    endOfDay.setHours(23, 59, 59, 999);
                    if (studentDate > endOfDay) return false;
                }
            }
            
            return true;
        });
    }, [students, filters]);
    
    const downloadCSV = () => {
        const headers = [
            "Reg. No.", "Student Name", "Father's Name", "Mobile No.", "Seat No.", 
            "Admission Type", "Shift", "Admission Date", "Next Due Date", "Fee Amount", "Fee Status", "Student Status"
        ];

        const rows = filteredStudents.map(s => {
            const isDue = new Date(s.next_due_date) < getTodayDate();
            const feeStatus = s.status === 'departed' ? 'N/A' : (isDue ? 'Due' : 'Paid');
            const escape = (str) => `"${String(str || '').replace(/"/g, '""')}"`;
            
            return [
                escape(s.student_id), escape(s.name), escape(s.father_name),
                escape(s.mobile), escape(s.seat_number), escape(s.admission_type),
                escape(s.shift || 'N/A'),
                escape(new Date(s.admission_date).toLocaleDateString('en-GB')),
                escape(new Date(s.next_due_date).toLocaleDateString('en-GB')),
                escape(s.fee_amount), escape(feeStatus),
                escape(s.status.charAt(0).toUpperCase() + s.status.slice(1))
            ].join(',');
        });

        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        const todayStr = new Date().toISOString().split('T')[0];
        link.setAttribute("download", `library_report_${todayStr}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                    <h3 className="text-2xl font-semibold text-gray-800">Student Reports & Filtering</h3>
                    <div className="flex items-center gap-2">
                         <Button onClick={resetFilters} className="bg-gray-200 text-gray-700 hover:bg-gray-300">
                            <FilterX size={16} className="mr-2"/> Reset
                        </Button>
                        <Button onClick={downloadCSV} className="bg-indigo-600 text-white hover:bg-indigo-700">
                            <Download size={16} className="mr-2"/> Download CSV
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-4 border rounded-lg bg-gray-50 md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Date Range</label>
                        <div className="flex flex-col sm:flex-row gap-2">
                            <select name="dateFilterType" value={filters.dateFilterType} onChange={handleFilterChange} className="p-2 border border-gray-300 rounded-lg bg-white w-full sm:w-1/3">
                                <option value="admission_date">Admission Date</option>
                                <option value="next_due_date">Next Due Date</option>
                            </select>
                            <input type="date" name="from" value={filters.dateRange.from} onChange={handleDateChange} className="p-2 border border-gray-300 rounded-lg w-full sm:w-1/3" />
                            <input type="date" name="to" value={filters.dateRange.to} onChange={handleDateChange} className="p-2 border border-gray-300 rounded-lg w-full sm:w-1/3" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Fee Status</label>
                        <select name="feeStatus" value={filters.feeStatus} onChange={handleFilterChange} className="w-full p-2 border border-gray-300 rounded-lg bg-white">
                            <option value="all">All Fee Status</option>
                            <option value="paid">Paid</option>
                            <option value="due">Due</option>
                        </select>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Admission Type</label>
                        <select name="shiftType" value={filters.shiftType} onChange={handleFilterChange} className="w-full p-2 border border-gray-300 rounded-lg bg-white">
                            <option value="all">All Types</option>
                            <option value="Full-time">Full-time</option>
                            <option value="Half-time">Half-time</option>
                        </select>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Student Status</label>
                        <select name="studentStatus" value={filters.studentStatus} onChange={handleFilterChange} className="w-full p-2 border border-gray-300 rounded-lg bg-white">
                            <option value="active">Active</option>
                            <option value="departed">Departed</option>
                            <option value="all">All Students</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
                 <h4 className="text-lg font-semibold text-gray-700 mb-4">
                    Filtered Results <span className="text-indigo-600 font-bold">({filteredStudents.length} students found)</span>
                </h4>
                <div className="overflow-auto max-h-[60vh] styled-scrollbar">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-gray-100 text-gray-600 uppercase sticky top-0">
                            <tr>
                                <th className="p-3">Reg. No</th>
                                <th className="p-3">Name</th>
                                <th className="p-3">Father's Name</th>
                                <th className="p-3">Mobile</th>
                                <th className="p-3">Seat</th>
                                <th className="p-3">Shift</th>
                                <th className="p-3">Admission Date</th>
                                <th className="p-3">Next Due Date</th>
                                <th className="p-3">Fee Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredStudents.length > 0 ? filteredStudents.map(s => {
                                const isDue = new Date(s.next_due_date) < getTodayDate();
                                const isDeparted = s.status === 'departed';
                                return (
                                <tr key={s.id} className="border-b hover:bg-gray-50">
                                    <td className="p-3 font-mono">{s.student_id}</td>
                                    <td className="p-3 font-medium text-gray-800">{s.name}</td>
                                    <td className="p-3">{s.father_name}</td>
                                    <td className="p-3">{s.mobile}</td>
                                    <td className="p-3">{s.seat_number}</td>
                                    <td className="p-3">{s.admission_type === 'Full-time' ? 'Full Day' : s.shift}</td>
                                    <td className="p-3">{new Date(s.admission_date).toLocaleDateString()}</td>
                                    <td className="p-3">{new Date(s.next_due_date).toLocaleDateString()}</td>
                                    <td className="p-3">
                                        <span className={`px-3 py-1 rounded-full font-semibold text-xs ${
                                            isDeparted ? 'bg-gray-200 text-gray-800' :
                                            isDue ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                                        }`}>
                                            {isDeparted ? 'Departed' : (isDue ? 'Due' : 'Paid')}
                                        </span>
                                    </td>
                                </tr>
                            )}) : (
                                <tr>
                                    <td colSpan="9" className="text-center p-8 text-gray-500">
                                        No students match the current filters. <br/> Try adjusting your search criteria.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

// --- NEW STUDENT PROFILE DETAIL MODAL ---
const StudentProfileDetailModal = ({ student }) => {
    const isFeeDue = new Date(student.next_due_date) < getTodayDate();
    const monthsPaidInAdvance = useMemo(() => {
        const today = new Date();
        const nextDueDate = new Date(student.next_due_date);
        if (nextDueDate <= today) return 0;
        
        let months = (nextDueDate.getFullYear() - today.getFullYear()) * 12;
        months -= today.getMonth();
        months += nextDueDate.getMonth();
        return months <= 0 ? 0 : months;
    }, [student.next_due_date]);

    return (
        <div className="p-2">
            <div className="flex flex-col md:flex-row items-center gap-6 border-b pb-6 mb-6">
                <img src={student.photo_url || 'https://placehold.co/128x128/e2e8f0/64748b?text=Photo'} alt={student.name} className="w-32 h-32 rounded-full object-cover border-4 border-indigo-200 shadow-lg" />
                <div className="flex-1 text-center md:text-left">
                    <h2 className="text-3xl font-bold text-gray-800">{student.title} {student.name}</h2>
                    <p className="text-indigo-600 font-mono">Reg. No: {student.student_id}</p>
                    <div className="flex items-center justify-center md:justify-start gap-4 mt-2 text-gray-600">
                        <span className="flex items-center gap-1"><Phone size={16} /> {student.mobile}</span>
                        <span className="flex items-center gap-1"><Armchair size={16} /> Seat {student.seat_number}</span>
                    </div>
                </div>
                <div className={`p-4 rounded-lg text-center ${isFeeDue ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                    <p className="font-bold text-lg">{isFeeDue ? 'Fee Due' : 'Fee Paid'}</p>
                    <p className="text-sm">Next Due: {new Date(student.next_due_date).toLocaleDateString()}</p>
                    {monthsPaidInAdvance > 0 && <p className="text-xs font-semibold mt-1">({monthsPaidInAdvance} Month(s) Advance)</p>}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-bold text-gray-600 mb-2">Personal Details</h4>
                    <p><span className="font-semibold">Father's Name:</span> {student.father_name}</p>
                    <p><span className="font-semibold">Admission Date:</span> {new Date(student.admission_date).toLocaleDateString()}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-bold text-gray-600 mb-2">Subscription Details</h4>
                    <p><span className="font-semibold">Admission Type:</span> {student.admission_type}</p>
                    <p><span className="font-semibold">Shift:</span> {student.admission_type === 'Full-time' ? 'Full Day' : student.shift}</p>
                    <p><span className="font-semibold">Fee Amount:</span> ₹{student.fee_amount}</p>
                </div>
            </div>

            <div>
                <h4 className="font-bold text-gray-600 mb-2">Payment History</h4>
                <div className="max-h-48 overflow-y-auto border rounded-lg styled-scrollbar">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-100 sticky top-0">
                            <tr>
                                <th className="p-2">Date</th>
                                <th className="p-2">Amount</th>
                                <th className="p-2">Method</th>
                            </tr>
                        </thead>
                        <tbody>
                            {student.payment_history && student.payment_history.length > 0 ? (
                                student.payment_history.map((p, i) => (
                                    <tr key={i} className="border-b">
                                        <td className="p-2">{new Date(p.date).toLocaleDateString()}</td>
                                        <td className="p-2 font-semibold">₹{p.amount}</td>
                                        <td className="p-2"><span className="text-xs bg-gray-200 px-2 py-1 rounded-full">{p.method}</span></td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan="3" className="text-center p-4 text-gray-500">No payment history found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};


export default App;