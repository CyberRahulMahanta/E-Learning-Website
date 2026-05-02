import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/UnifiedNavbar";
import useApi from "../hooks/useApi";

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
};

const CourseCertificateVerify = () => {
  const { certificateCode } = useParams();
  const navigate = useNavigate();
  const api = useApi();

  const [inputCode, setInputCode] = useState(certificateCode || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [certificate, setCertificate] = useState(null);

  const verify = async (code) => {
    const normalized = String(code || "").trim();
    if (!normalized) {
      setError("Certificate code is required.");
      setCertificate(null);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await api.get(`/certificates/verify/${encodeURIComponent(normalized)}`);
      setCertificate(response?.data?.certificate || null);
    } catch (err) {
      setCertificate(null);
      setError(err?.response?.data?.message || "Certificate not found.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (certificateCode) {
      verify(certificateCode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [certificateCode]);

  return (
    <>
      <Navbar />
      <main className="min-h-screen px-6 pt-32 pb-16 text-white bg-black">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between gap-3 mb-6">
            <h1 className="text-3xl font-bold">Certificate Verification</h1>
            <button className="px-4 py-2 text-sm rounded bg-stone-700 hover:bg-stone-600" onClick={() => navigate("/")}>Back</button>
          </div>

          <form
            className="p-4 border rounded border-fuchsia-700 bg-stone-950"
            onSubmit={(event) => {
              event.preventDefault();
              verify(inputCode);
            }}
          >
            <label className="block text-sm text-gray-300">Certificate Code</label>
            <div className="flex gap-2 mt-2">
              <input
                className="flex-1 p-3 text-white border rounded bg-black border-stone-700"
                value={inputCode}
                onChange={(event) => setInputCode(event.target.value)}
                placeholder="CERT-YYYYMMDD-..."
              />
              <button type="submit" className="px-4 py-2 rounded bg-fuchsia-700 hover:bg-fuchsia-600 disabled:opacity-60" disabled={loading}>
                {loading ? "Verifying..." : "Verify"}
              </button>
            </div>
          </form>

          {error ? <p className="p-3 mt-4 text-red-300 border rounded bg-red-950/30 border-red-800">{error}</p> : null}

          {certificate ? (
            <section className="p-5 mt-6 border rounded border-green-700 bg-green-950/20">
              <p className="text-sm tracking-wide text-green-300 uppercase">Verified Certificate</p>
              <h2 className="mt-2 text-2xl font-semibold">{certificate?.course?.name || "Course"}</h2>
              <p className="mt-1 text-sm text-gray-300">Learner: {certificate?.user?.username || certificate?.user?.email || "-"}</p>
              <p className="mt-1 text-sm text-gray-300">Issued on: {formatDate(certificate?.issueDate)}</p>
              <p className="mt-1 text-sm text-gray-300 break-all">Code: {certificate?.certificateCode}</p>
            </section>
          ) : null}
        </div>
      </main>
    </>
  );
};

export default CourseCertificateVerify;
