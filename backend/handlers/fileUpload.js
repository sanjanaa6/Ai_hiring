const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Interview = require('../models/Interview');
const User = require('../models/User');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads/interviews');
    
    // Ensure directory exists
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: timestamp_candidateId_originalname
    const uniqueSuffix = Date.now() + '_' + Math.round(Math.random() * 1E9);
    const candidateId = req.user?.id || 'anonymous';
    const extension = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, extension);
    
    cb(null, `${uniqueSuffix}_${candidateId}_${baseName}${extension}`);
  }
});

// File filter to restrict file types
const fileFilter = (req, file, cb) => {
  console.log('🔍 [FILE UPLOAD] Checking file type:', file.mimetype);
  
  // Allowed file types
  const allowedTypes = [
    'application/pdf',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'image/jpeg',
    'image/png',
    'image/gif'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} not allowed. Allowed types: PDF, PPT, PPTX, DOC, DOCX, TXT, JPG, PNG, GIF`), false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Upload file for interview round
const uploadInterviewFile = async (req, res) => {
  console.log('📁 [FILE UPLOAD] Starting file upload for interview:', req.params.interviewId);
  console.log('👤 [FILE UPLOAD] User ID:', req.user.id);
  console.log('📋 [FILE UPLOAD] Request body:', req.body);
  
  try {
    const { interviewId } = req.params;
    const { roundId, requirementId } = req.body;
    
    if (!roundId || !requirementId) {
      return res.status(400).json({
        success: false,
        error: 'Round ID and requirement ID are required'
      });
    }
    
    // Find the interview
    const interview = await Interview.findOne({
      interviewId: interviewId,
      approvalStatus: 'approved'
    });
    
    if (!interview) {
      return res.status(404).json({
        success: false,
        error: 'Interview not found or not available'
      });
    }
    
    // Find the specific round and requirement
    const round = interview.rounds.find(r => r.roundId === roundId);
    if (!round || round.type !== 'file_upload') {
      return res.status(400).json({
        success: false,
        error: 'Invalid round or round is not a file upload round'
      });
    }
    
    const requirement = round.fileUploadRequirements.find(r => r.id === requirementId);
    if (!requirement) {
      return res.status(400).json({
        success: false,
        error: 'File upload requirement not found'
      });
    }
    
    // Get user info
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }
    
    // Validate file type against requirement
    const fileExtension = path.extname(req.file.originalname).toLowerCase().substring(1);
    if (requirement.fileTypes.length > 0 && !requirement.fileTypes.includes(fileExtension)) {
      // Delete the uploaded file since it's not valid
      fs.unlinkSync(req.file.path);
      
      return res.status(400).json({
        success: false,
        error: `File type .${fileExtension} not allowed. Allowed types: ${requirement.fileTypes.join(', ')}`
      });
    }
    
    // Validate file size
    const fileSizeMB = req.file.size / (1024 * 1024);
    if (fileSizeMB > requirement.maxFileSize) {
      // Delete the uploaded file since it's too large
      fs.unlinkSync(req.file.path);
      
      return res.status(400).json({
        success: false,
        error: `File size ${fileSizeMB.toFixed(2)}MB exceeds maximum allowed size of ${requirement.maxFileSize}MB`
      });
    }
    
    // Check if user already uploaded a file for this requirement
    const existingUpload = interview.fileUploads.find(
      upload => upload.candidateId === req.user.id && 
                upload.roundId === roundId && 
                upload.requirementId === requirementId
    );
    
    if (existingUpload) {
      // Delete old file
      try {
        if (fs.existsSync(existingUpload.filePath)) {
          fs.unlinkSync(existingUpload.filePath);
        }
      } catch (error) {
        console.warn('⚠️ [FILE UPLOAD] Could not delete old file:', error.message);
      }
      
      // Remove old upload record
      interview.fileUploads = interview.fileUploads.filter(
        upload => !(upload.candidateId === req.user.id && 
                    upload.roundId === roundId && 
                    upload.requirementId === requirementId)
      );
    }
    
    // Create file upload record
    const fileUpload = {
      candidateId: req.user.id,
      candidateName: user.name,
      candidateEmail: user.email,
      roundId: roundId,
      requirementId: requirementId,
      requirementTitle: requirement.title,
      fileName: req.file.filename,
      originalFileName: req.file.originalname,
      filePath: req.file.path,
      fileSize: req.file.size,
      fileType: fileExtension,
      uploadedAt: new Date(),
      status: 'uploaded'
    };
    
    // Add to interview
    interview.fileUploads.push(fileUpload);
    
    // Update user's interview progress
    const userProgress = user.interviewProgress.find(p => p.interviewId === interviewId);
    if (userProgress) {
      if (!userProgress.fileUploads) {
        userProgress.fileUploads = [];
      }
      
      // Remove existing upload for this requirement if any
      userProgress.fileUploads = userProgress.fileUploads.filter(
        upload => !(upload.roundId === roundId && upload.requirementId === requirementId)
      );
      
      // Add new upload
      userProgress.fileUploads.push({
        roundId: roundId,
        requirementId: requirementId,
        fileName: req.file.filename,
        originalFileName: req.file.originalname,
        uploadedAt: new Date()
      });
      
      userProgress.lastActivity = new Date();
    }
    
    // Save both documents
    await interview.save();
    await user.save();
    
    console.log('✅ [FILE UPLOAD] File uploaded successfully:', req.file.filename);
    
    res.json({
      success: true,
      message: 'File uploaded successfully',
      data: {
        fileName: req.file.filename,
        originalFileName: req.file.originalname,
        fileSize: req.file.size,
        fileType: fileExtension,
        uploadedAt: fileUpload.uploadedAt,
        requirementTitle: requirement.title
      }
    });
    
  } catch (error) {
    console.error('❌ [FILE UPLOAD] Error occurred:', error.message);
    
    // Clean up uploaded file if there was an error
    if (req.file && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.error('❌ [FILE UPLOAD] Could not clean up file:', cleanupError.message);
      }
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to upload file'
    });
  }
};

// Get uploaded files for a candidate in a specific round
const getCandidateUploads = async (req, res) => {
  console.log('📁 [FILE UPLOAD] Getting candidate uploads for interview:', req.params.interviewId);
  console.log('👤 [FILE UPLOAD] User ID:', req.user.id);
  
  try {
    const { interviewId } = req.params;
    const { roundId } = req.query;
    
    // Find the interview
    const interview = await Interview.findOne({
      interviewId: interviewId,
      approvalStatus: 'approved'
    });
    
    if (!interview) {
      return res.status(404).json({
        success: false,
        error: 'Interview not found or not available'
      });
    }
    
    // Filter uploads for this candidate
    let uploads = interview.fileUploads.filter(upload => upload.candidateId === req.user.id);
    
    // Filter by round if specified
    if (roundId) {
      uploads = uploads.filter(upload => upload.roundId === roundId);
    }
    
    // Format response
    const formattedUploads = uploads.map(upload => ({
      id: upload._id,
      roundId: upload.roundId,
      requirementId: upload.requirementId,
      requirementTitle: upload.requirementTitle,
      fileName: upload.fileName,
      originalFileName: upload.originalFileName,
      fileSize: upload.fileSize,
      fileType: upload.fileType,
      uploadedAt: upload.uploadedAt,
      status: upload.status,
      reviewNotes: upload.reviewNotes
    }));
    
    res.json({
      success: true,
      data: formattedUploads
    });
    
  } catch (error) {
    console.error('❌ [FILE UPLOAD] Error getting uploads:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to get uploaded files'
    });
  }
};

// Download uploaded file (for recruiters/admins)
const downloadFile = async (req, res) => {
  console.log('📁 [FILE DOWNLOAD] Download request for file:', req.params.fileName);
  console.log('👤 [FILE DOWNLOAD] User ID:', req.user.id);
  
  try {
    const { interviewId, fileName } = req.params;
    
    // Find the interview
    const interview = await Interview.findOne({
      interviewId: interviewId
    });
    
    if (!interview) {
      return res.status(404).json({
        success: false,
        error: 'Interview not found'
      });
    }
    
    // Check if user has permission (admin, recruiter, or interview creator)
    if (req.user.role !== 'admin' && 
        req.user.role !== 'recruiter' && 
        interview.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }
    
    // Find the file upload record
    const fileUpload = interview.fileUploads.find(upload => upload.fileName === fileName);
    if (!fileUpload) {
      return res.status(404).json({
        success: false,
        error: 'File not found'
      });
    }
    
    // Check if file exists on disk
    if (!fs.existsSync(fileUpload.filePath)) {
      return res.status(404).json({
        success: false,
        error: 'File not found on server'
      });
    }
    
    // Set appropriate headers
    res.setHeader('Content-Disposition', `attachment; filename="${fileUpload.originalFileName}"`);
    res.setHeader('Content-Type', 'application/octet-stream');
    
    // Stream the file
    const fileStream = fs.createReadStream(fileUpload.filePath);
    fileStream.pipe(res);
    
    console.log('✅ [FILE DOWNLOAD] File download started:', fileUpload.originalFileName);
    
  } catch (error) {
    console.error('❌ [FILE DOWNLOAD] Error occurred:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to download file'
    });
  }
};

// Review uploaded file (for recruiters/admins)
const reviewFile = async (req, res) => {
  console.log('📁 [FILE REVIEW] Review request for file:', req.params.fileName);
  console.log('👤 [FILE REVIEW] User ID:', req.user.id);
  
  try {
    const { interviewId, fileName } = req.params;
    const { status, reviewNotes } = req.body;
    
    if (!status || !['reviewed', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Valid status is required (reviewed, approved, rejected)'
      });
    }
    
    // Find the interview
    const interview = await Interview.findOne({
      interviewId: interviewId
    });
    
    if (!interview) {
      return res.status(404).json({
        success: false,
        error: 'Interview not found'
      });
    }
    
    // Check if user has permission (admin, recruiter, or interview creator)
    if (req.user.role !== 'admin' && 
        req.user.role !== 'recruiter' && 
        interview.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }
    
    // Find and update the file upload record
    const fileUpload = interview.fileUploads.find(upload => upload.fileName === fileName);
    if (!fileUpload) {
      return res.status(404).json({
        success: false,
        error: 'File not found'
      });
    }
    
    fileUpload.status = status;
    fileUpload.reviewNotes = reviewNotes || '';
    fileUpload.reviewedBy = req.user.id;
    fileUpload.reviewedAt = new Date();
    
    await interview.save();
    
    console.log('✅ [FILE REVIEW] File reviewed successfully:', fileName);
    
    res.json({
      success: true,
      message: 'File review updated successfully',
      data: {
        fileName: fileUpload.fileName,
        originalFileName: fileUpload.originalFileName,
        status: fileUpload.status,
        reviewNotes: fileUpload.reviewNotes,
        reviewedAt: fileUpload.reviewedAt
      }
    });
    
  } catch (error) {
    console.error('❌ [FILE REVIEW] Error occurred:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to review file'
    });
  }
};

// Get all uploaded files for an interview (for recruiters/admins)
const getAllInterviewUploads = async (req, res) => {
  console.log('📁 [FILE UPLOAD] Getting all uploads for interview:', req.params.interviewId);
  console.log('👤 [FILE UPLOAD] User ID:', req.user.id);
  
  try {
    const { interviewId } = req.params;
    
    // Find the interview
    const interview = await Interview.findOne({
      interviewId: interviewId
    });
    
    if (!interview) {
      return res.status(404).json({
        success: false,
        error: 'Interview not found'
      });
    }
    
    // Check if user has permission (admin, recruiter, or interview creator)
    if (req.user.role !== 'admin' && 
        req.user.role !== 'recruiter' && 
        interview.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }
    
    // Get all uploads for this interview
    const uploads = interview.fileUploads || [];
    
    // Format response
    const formattedUploads = uploads.map(upload => ({
      id: upload._id,
      candidateId: upload.candidateId,
      candidateName: upload.candidateName,
      candidateEmail: upload.candidateEmail,
      roundId: upload.roundId,
      requirementId: upload.requirementId,
      requirementTitle: upload.requirementTitle,
      fileName: upload.fileName,
      originalFileName: upload.originalFileName,
      fileSize: upload.fileSize,
      fileType: upload.fileType,
      uploadedAt: upload.uploadedAt,
      status: upload.status,
      reviewNotes: upload.reviewNotes,
      reviewedBy: upload.reviewedBy,
      reviewedAt: upload.reviewedAt
    }));
    
    res.json({
      success: true,
      data: formattedUploads
    });
    
  } catch (error) {
    console.error('❌ [FILE UPLOAD] Error getting all uploads:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to get uploaded files'
    });
  }
};

module.exports = {
  upload,
  uploadInterviewFile,
  getCandidateUploads,
  getAllInterviewUploads,
  downloadFile,
  reviewFile
};

