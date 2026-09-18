import { createRouter, createWebHistory } from "vue-router";
import LoginView from "../views/LoginView.vue";
import PatientPortal from "../views/PatientPortal.vue";
import DoctorDashboard from "../views/DoctorDashboard.vue";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/",
      redirect: "/login",
    },
    {
      path: "/login",
      name: "login",
      component: LoginView,
      meta: { depth: 0 },  // Login = tầng thấp nhất (bên dưới)
    },
    {
      path: "/patient",
      name: "patient",
      component: PatientPortal,
      meta: { depth: 1 },  // Dashboard = tầng cao hơn (bên trên)
    },
    {
      path: "/admin",
      name: "admin",
      component: DoctorDashboard,
      meta: { depth: 1 },
    },
  ],
});

export default router;
