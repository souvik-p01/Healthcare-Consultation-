// src/components/GoogleLoginButton.jsx
import React from "react";
import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import { useAppContext } from "../context/AppContext";
import { toast } from "react-toastify";

const GoogleLoginButton = ({ buttonText = "Sign in with Google", isSignUp = false }) => {
  const { googleLogin, loading } = useAppContext();

  const handleSuccess = async (credentialResponse) => {
    try {
      if (!credentialResponse?.credential) {
        throw new Error("No credential received from Google");
      }

      const decoded = jwtDecode(credentialResponse.credential);
      console.log("Google User:", decoded);

      if (typeof googleLogin !== "function") {
        throw new Error("googleLogin function not found in AppContext");
      }

      await googleLogin({
        credential: credentialResponse.credential,
      });

      toast.success("Google login successful!");
      
    } catch (error) {
      console.error("Google login failed:", error);
      toast.error(error.message || "Google login failed. Please try again.");
    }
  };

  const handleError = (error) => {
    console.error("Google Sign-In error:", error);
    toast.error("Google Sign-In failed. Please try again.");
  };

  return (
    <div className="w-full flex justify-center relative">
      <GoogleLogin
        onSuccess={handleSuccess}
        onError={handleError}
        useOneTap
        theme="outline"
        size="large"
        text={isSignUp ? "signup_with" : "signin_with"}
        shape="rectangular"
        width="300" // ✅ Changed from "100%" to number "300"
        locale="en"
        logo_alignment="center"
      />
      
      {loading && (
        <div className="absolute inset-0 bg-white bg-opacity-50 flex items-center justify-center rounded-lg">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
      )}
    </div>
  );
};

export default GoogleLoginButton;