import UploadPDF from "../../components/UploadPDF.js";
import AskQuestion from "../../components/AskQuestion.js";

export default function Home() {
  return (
    <div>
      <h1>PDF Question Answering System</h1>
      <UploadPDF />
      <AskQuestion />
    </div>
  );
}