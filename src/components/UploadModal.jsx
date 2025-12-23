import React, { useState } from 'react';
import { X, Upload, Loader } from 'lucide-react';
import { supabase } from '../supabaseClient';
import './UploadModal.css';
import watermarkImg from '../assets/watermark.png';
import { compressImage } from '../utils/imageCompression';

const MOVIES = ['GOAT', 'Leo', 'Master', 'Beast', 'Varisu', 'Bigil', 'Mersal', 'Sarkar', 'The Greatest Of All Time', 'Other'];

const UploadModal = ({ onClose, onUploadSuccess }) => {
    const [prompt, setPrompt] = useState('');
    const [category, setCategory] = useState('GOAT');
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            setPreview(URL.createObjectURL(selectedFile));
            setError(null);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file || !prompt) {
            setError('Please provide both an image and a prompt.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // 1. Compress the image before uploading
            const compressedBlob = await compressImage(file, 0.5); // 50% quality

            // 2. Upload compressed image to Supabase Storage
            const fileExt = 'jpg'; // Always use jpg after compression
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('images')
                .upload(filePath, compressedBlob, {
                    contentType: 'image/jpeg'
                });

            if (uploadError) throw uploadError;

            // 3. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('images')
                .getPublicUrl(filePath);

            // 4. Insert into Database
            const { data, error: dbError } = await supabase
                .from('cards')
                .insert([
                    { prompt: prompt, image_url: publicUrl, category: category }
                ])
                .select();

            if (dbError) throw dbError;

            onUploadSuccess(data[0]);
            onClose();
        } catch (err) {
            console.error('Upload error:', err);
            setError(err.message || 'Failed to upload. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="upload-modal-overlay" onClick={onClose}>
            <div className="upload-modal-content" onClick={e => e.stopPropagation()}>
                <button className="upload-modal-close" onClick={onClose}>
                    <X size={24} />
                </button>

                <h2>Upload New Image</h2>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Image</label>
                        <div className={`file-drop-area ${preview ? 'has-image' : ''}`}>
                            {preview ? (
                                <>
                                    <img src={watermarkImg} className="watermark-img" alt="watermark" style={{
                                        position: 'absolute',
                                        top: '50%',
                                        left: '50%',
                                        transform: 'translate(-50%, -50%) rotate(-25deg)',
                                        width: '60%',
                                        opacity: 0.6, /* Increased visibility */
                                        pointerEvents: 'none',
                                        zIndex: 10,
                                        filter: 'brightness(0) invert(1) drop-shadow(0 4px 10px rgba(0,0,0,0.5))'
                                    }} />
                                    <img src={preview} alt="Preview" className="file-preview" />
                                </>
                            ) : (
                                <div className="file-placeholder">
                                    <Upload size={32} />
                                    <span>Click to upload or drag and drop</span>
                                </div>
                            )}
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="file-input"
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Movie Category</label>
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="category-select"
                        >
                            {MOVIES.map(movie => (
                                <option key={movie} value={movie}>{movie}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Prompt</label>
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="Describe the image..."
                            rows={4}
                            className="prompt-input"
                        />
                    </div>

                    {error && <div className="error-message">{error}</div>}

                    <div className="form-actions">
                        <button type="button" className="btn-cancel" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="btn-submit" disabled={loading}>
                            {loading ? (
                                <>
                                    <Loader size={16} className="spinner" /> Uploading...
                                </>
                            ) : (
                                'Add Card'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UploadModal;
