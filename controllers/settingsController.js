const Settings = require('../models/Settings');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');

// Configure Cloudinary explicitly
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * @route   GET /api/settings/checklist
 */
exports.getChecklist = async (req, res) => {
    try {
        let settings = await Settings.findOne({ key: 'app_settings' });
        if (!settings) {
            settings = await Settings.create({ key: 'app_settings' });
        }
        res.json({
            checklistPdfPath: settings.checklistPdfPath,
            checklistPdfOriginalName: settings.checklistPdfOriginalName,
            updatedAt: settings.updatedAt
        });
    } catch (error) {
        console.error('Fetch Settings Error:', error);
        res.status(500).json({ message: 'Server error fetching settings' });
    }
};

/**
 * @route   POST /api/settings/upload-checklist
 */
exports.uploadChecklist = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Please upload a PDF file' });
        }

        console.log(`Final Attempt: Processing ${req.file.originalname}`);

        /**
         * THE FAIL-PROOF CONFIGURATION:
         * 1. resource_type: 'raw' -> Sabse stable tareeka, koi compression ya tampering nahi.
         * 2. public_id with .pdf -> Browser ko extension milna chahiye.
         * 3. content_disposition: 'inline' -> Cloudinary browser ko bolega "Show it, don't download it".
         */
        const uploadResult = await cloudinary.uploader.upload(req.file.path, {
            folder: 'checklists',
            resource_type: 'raw',
            public_id: `checklist-${Date.now()}.pdf`,
            content_disposition: 'inline'
        });

        console.log('Upload Worked! Link:', uploadResult.secure_url);

        // Delete temp local file
        if (fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        let settings = await Settings.findOne({ key: 'app_settings' });
        if (!settings) {
            settings = new Settings({ key: 'app_settings' });
        }

        // Cleanup old files from both raw and image just in case
        if (settings.checklistPdfPublicId) {
            try {
                await cloudinary.uploader.destroy(settings.checklistPdfPublicId, { resource_type: 'raw' });
                await cloudinary.uploader.destroy(settings.checklistPdfPublicId, { resource_type: 'image' });
            } catch (err) {
                console.warn('Cleanup skipped/not needed');
            }
        }

        settings.checklistPdfPath = uploadResult.secure_url;
        settings.checklistPdfOriginalName = req.file.originalname;
        settings.checklistPdfPublicId = uploadResult.public_id;
        settings.updatedBy = req.user ? req.user.id : null;

        await settings.save();

        res.json({
            message: 'Checklist updated successfully!',
            checklistPdfPath: settings.checklistPdfPath,
            checklistPdfOriginalName: settings.checklistPdfOriginalName
        });
    } catch (error) {
        console.error('Upload Process Fatal Error:', error);
        if (req.file && req.file.path && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ message: 'Cloudinary Upload Failed: ' + error.message });
    }
};

/**
 * @route   DELETE /api/settings/checklist
 */
exports.deleteChecklist = async (req, res) => {
    try {
        let settings = await Settings.findOne({ key: 'app_settings' });
        if (!settings || !settings.checklistPdfPath) {
            return res.status(404).json({ message: 'Nothing here' });
        }

        if (settings.checklistPdfPublicId) {
            await cloudinary.uploader.destroy(settings.checklistPdfPublicId, { resource_type: 'raw' });
        }

        settings.checklistPdfPath = '';
        settings.checklistPdfOriginalName = '';
        settings.checklistPdfPublicId = '';

        await settings.save();
        res.json({ message: 'Checklist cleared' });
    } catch (error) {
        res.status(500).json({ message: 'Delete error' });
    }
};
