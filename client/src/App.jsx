import AppRoutes from "./routes/AppRoutes";
import Doctors from "./pages/admin/Doctors";

function App() {
    return <AppRoutes />;
}

export default App;

// import { BrowserRouter, Routes, Route } from "react-router-dom";

// import Login from "./pages/Login";
// import AdminDashboard from "./pages/admin/AdminDashboard";
// import Doctors from "./pages/admin/Doctors";

// function App() {
//     return (
//         <BrowserRouter>
//             <Routes>

//                 <Route
//                     path="/login"
//                     element={<Login />}
//                 />

//                 <Route
//                     path="/admin/dashboard"
//                     element={
//                         <AdminDashboard />
//                     }
//                 />

//                 <Route
//                     path="/admin/doctors"
//                     element={
//                         <Doctors />
//                     }
//                 />

//             </Routes>
//         </BrowserRouter>
//     );
// }

// export default App;