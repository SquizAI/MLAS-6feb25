import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

function Upload() {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    // Handle your file upload logic here
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  return (
    <div {...getRootProps()} className="dropzone">
      <input {...getInputProps()} />
      {isDragActive ? (
        <p>Drop the files here ...</p>
      ) : (
        <p>Drag 'n' drop some files here, or click to select files</p>
      )}
    </div>
  );
}

export default Upload; 