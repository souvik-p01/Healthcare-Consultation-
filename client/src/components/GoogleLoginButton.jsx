// src/components/GoogleLoginButton.jsx
import React from "react";
import { GoogleLogin } from "@react-oauth/google";
import { useAppContext } from "../context/AppContext";
import { toast } from "react-toastify";

const GoogleLoginButton = ({ isSignUp = false }) => {
  const { googleLogin, loading } = useAppContext();

  const handleSuccess = async (credentialResponse) => {
    try {
      if (!credentialResponse?.credential) {
        throw new Error("No credential received from Google");
      }
      await googleLogin({ credential: credentialResponse.credential });
    } catch (error) {
      console.error("Google login failed:", error);
      toast.error(error.message || "Google login failed. Please try again.");
    }
  };

  const handleError = () => {
    toast.error("Google Sign-In failed. Please try again.");
  };

  return (
    <div className="w-full flex justify-center relative">
      <GoogleLogin
        onSuccess={handleSuccess}
        onError={handleError}
        useOneTap={false}
        auto_select={false}
        theme="outline"
        size="large"
        text={isSignUp ? "signup_with" : "signin_with"}
        shape="rectangular"
        width="360"
        locale="en"
      />
      {loading && (
        <div className="absolute inset-0 bg-white bg-opacity-60 flex items-center justify-center rounded-lg">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
        </div>
      )}
    </div>
  );
};

export default GoogleLoginButton;