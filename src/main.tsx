import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { MotionConfig } from "framer-motion";
import { router } from "./router";
import { AppProvider } from "@/store/app";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <MotionConfig reducedMotion="user">
      <AppProvider>
        <RouterProvider router={router} />
      </AppProvider>
    </MotionConfig>
  </StrictMode>,
);
