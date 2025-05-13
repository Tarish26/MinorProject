import { useState } from "react";
import UploadForm from "./components/UploadForm";
import Header from "./components/Header";
import Chatbot from "./components/chatbot";
import "./index.css";

export default function App() {
  const [detectionResult, setDetectionResult] = useState(null);
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="lg:w-1/2">
            <UploadForm onResultReceived={setDetectionResult} />
          </div>
          <div className="lg:w-1/2">
            <Chatbot detectionResult={detectionResult} />
          </div>
        </div>
      </div>
    </div>
  );
}