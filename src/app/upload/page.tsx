import MediaForm from "@/components/MediaForm";
import { requireAuth } from "@/lib/authActions";

const Upload = async () => {
  await requireAuth();
  return (
    <div>
      <main>
        <h1 className="text-4xl font-bold">Upload</h1>
        <MediaForm />
      </main>
    </div>
  );
};

export default Upload;
