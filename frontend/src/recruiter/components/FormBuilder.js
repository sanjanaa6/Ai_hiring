import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Trash2, 
  GripVertical, 
  Eye, 
  Save, 
  X,
  Type,
  FileText,
  Mail,
  Hash,
  Circle,
  CheckSquare,
  List,
  Upload,
  Video,
  Image as ImageIcon,
  EyeOff
} from 'lucide-react';

const FormBuilder = ({ isDarkMode, onSave, initialForm = null }) => {
  const [formTitle, setFormTitle] = useState(initialForm?.title || 'Untitled Form');
  const [formDescription, setFormDescription] = useState(initialForm?.description || '');
  const [fields, setFields] = useState(initialForm?.fields || []);
  const [previewMode, setPreviewMode] = useState(false);
  const [draggedItem, setDraggedItem] = useState(null);
  const [showFieldPicker, setShowFieldPicker] = useState(false);

  const fieldTypes = [
    { id: 'text', label: 'Short Text', icon: Type, color: 'text-pink-500' },
    { id: 'textarea', label: 'Long Text', icon: FileText, color: 'text-blue-500' },
    { id: 'email', label: 'Email', icon: Mail, color: 'text-blue-500' },
    { id: 'number', label: 'Number', icon: Hash, color: 'text-blue-500' },
    { id: 'radio', label: 'Radio Buttons', icon: Circle, color: 'text-gray-500' },
    { id: 'checkbox', label: 'Checkboxes', icon: CheckSquare, color: 'text-purple-500' },
    { id: 'dropdown', label: 'Dropdown', icon: List, color: 'text-orange-500' },
    { id: 'file', label: 'File Upload', icon: Upload, color: 'text-orange-500' },
    { id: 'video', label: 'Video Upload', icon: Video, color: 'text-purple-500' },
    { id: 'media', label: 'Media Upload', icon: ImageIcon, color: 'text-green-500' },
  ];

  const addField = (type) => {
    const newField = {
      id: Date.now(),
      type,
      label: getDefaultLabel(type),
      required: false,
      options: type === 'radio' || type === 'checkbox' || type === 'dropdown' 
        ? ['Option 1', 'Option 2', 'Option 3'] 
        : [],
      allowedFileTypes: type === 'file' || type === 'video' || type === 'media' 
        ? getDefaultFileTypes(type) 
        : [],
      placeholder: '',
      description: ''
    };
    setFields([...fields, newField]);
    setShowFieldPicker(false);
  };

  const getDefaultLabel = (type) => {
    const labels = {
      text: 'Short Answer',
      textarea: 'Long Answer',
      email: 'Email Address',
      number: 'Number',
      radio: 'Multiple Choice',
      checkbox: 'Checkboxes',
      dropdown: 'Dropdown',
      file: 'File Upload',
      video: 'Video Upload',
      media: 'Media Upload',
    };
    return labels[type] || 'Field';
  };

  const getDefaultFileTypes = (type) => {
    if (type === 'video') return ['.mp4', '.mov', '.avi'];
    if (type === 'media') return ['.jpg', '.png', '.gif', '.mp4', '.mp3'];
    return ['.pdf', '.doc', '.docx', '.txt'];
  };

  const updateField = (id, key, value) => {
    setFields(fields.map(f => f.id === id ? { ...f, [key]: value } : f));
  };

  const deleteField = (id) => {
    setFields(fields.filter(f => f.id !== id));
  };

  const duplicateField = (id) => {
    const field = fields.find(f => f.id === id);
    if (field) {
      const newField = { ...field, id: Date.now() };
      const index = fields.findIndex(f => f.id === id);
      const newFields = [...fields];
      newFields.splice(index + 1, 0, newField);
      setFields(newFields);
    }
  };

  const handleDragStart = (e, id) => {
    setDraggedItem(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, id) => {
    e.preventDefault();
    if (draggedItem === id) return;

    const draggedIndex = fields.findIndex(f => f.id === draggedItem);
    const targetIndex = fields.findIndex(f => f.id === id);
    
    if (draggedIndex !== -1 && targetIndex !== -1) {
      const newFields = [...fields];
      const [removed] = newFields.splice(draggedIndex, 1);
      newFields.splice(targetIndex, 0, removed);
      setFields(newFields);
    }
  };

  const addOption = (fieldId) => {
    const field = fields.find(f => f.id === fieldId);
    if (field) {
      const newOptions = [...field.options, `Option ${field.options.length + 1}`];
      updateField(fieldId, 'options', newOptions);
    }
  };

  const updateOption = (fieldId, optionIndex, value) => {
    const field = fields.find(f => f.id === fieldId);
    if (field) {
      const newOptions = [...field.options];
      newOptions[optionIndex] = value;
      updateField(fieldId, 'options', newOptions);
    }
  };

  const removeOption = (fieldId, optionIndex) => {
    const field = fields.find(f => f.id === fieldId);
    if (field && field.options.length > 1) {
      const newOptions = field.options.filter((_, i) => i !== optionIndex);
      updateField(fieldId, 'options', newOptions);
    }
  };

  const handleSave = () => {
    const formData = {
      title: formTitle,
      description: formDescription,
      fields: fields
    };
    
    if (onSave) {
      onSave(formData);
    }
    
    console.log('Form saved:', formData);
    alert('Form saved successfully!');
  };

  const getFieldIcon = (type) => {
    const fieldType = fieldTypes.find(ft => ft.id === type);
    return fieldType ? fieldType.icon : Type;
  };

  const getFieldColor = (type) => {
    const fieldType = fieldTypes.find(ft => ft.id === type);
    return fieldType ? fieldType.color : 'text-gray-500';
  };

  const renderFieldEditor = (field) => {
    const FieldIcon = getFieldIcon(field.type);
    const fieldColor = getFieldColor(field.type);

    return (
      <motion.div
        key={field.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        draggable
        onDragStart={(e) => handleDragStart(e, field.id)}
        onDragOver={(e) => handleDragOver(e, field.id)}
        className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-lg border-2 p-6 mb-4 hover:border-blue-400 transition-all shadow-sm`}
      >
        <div className="flex items-start gap-3">
          <div className="cursor-move mt-2">
            <GripVertical className={`w-5 h-5 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
          </div>
          
          <div className="flex-1">
            <div className="flex gap-3 mb-4">
              <input
                type="text"
                value={field.label}
                onChange={(e) => updateField(field.id, 'label', e.target.value)}
                className={`flex-1 text-lg font-medium border-b-2 border-transparent hover:border-gray-300 focus:border-blue-500 outline-none px-2 py-1 ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}
                placeholder="Question"
              />
              <select
                value={field.type}
                onChange={(e) => updateField(field.id, 'type', e.target.value)}
                className={`border rounded px-3 py-1 text-sm ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
              >
                {fieldTypes.map(ft => (
                  <option key={ft.id} value={ft.id}>{ft.label}</option>
                ))}
              </select>
            </div>

            <input
              type="text"
              value={field.description}
              onChange={(e) => updateField(field.id, 'description', e.target.value)}
              className={`w-full text-sm border-b border-transparent hover:border-gray-300 focus:border-blue-500 outline-none px-2 py-1 mb-3 ${isDarkMode ? 'bg-gray-800 text-gray-400' : 'bg-white text-gray-600'}`}
              placeholder="Description (optional)"
            />

            {(field.type === 'radio' || field.type === 'checkbox' || field.type === 'dropdown') ? (
              <div className="space-y-2">
                {field.options.map((option, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    {field.type === 'radio' && <Circle className={`w-4 h-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />}
                    {field.type === 'checkbox' && <CheckSquare className={`w-4 h-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />}
                    {field.type === 'dropdown' && <span className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>{idx + 1}.</span>}
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => updateOption(field.id, idx, e.target.value)}
                      className={`flex-1 border-b px-2 py-1 text-sm ${isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                    />
                    {field.options.length > 1 && (
                      <button
                        onClick={() => removeOption(field.id, idx)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={() => addOption(field.id)}
                  className="text-blue-600 text-sm hover:text-blue-800 mt-2 flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  Add option
                </button>
              </div>
            ) : (field.type === 'file' || field.type === 'video' || field.type === 'media') ? (
              <div>
                <div className={`text-sm mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Allowed file types:</div>
                <input
                  type="text"
                  value={field.allowedFileTypes.join(', ')}
                  onChange={(e) => updateField(field.id, 'allowedFileTypes', e.target.value.split(',').map(s => s.trim()))}
                  className={`w-full border rounded px-3 py-2 text-sm ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                  placeholder=".pdf, .doc, .jpg"
                />
              </div>
            ) : (
              <input
                type={field.type === 'email' ? 'email' : field.type === 'number' ? 'number' : 'text'}
                placeholder={field.placeholder || 'Your answer'}
                className={`w-full border-b px-2 py-2 text-sm ${isDarkMode ? 'bg-gray-800 border-gray-600 text-gray-400' : 'bg-white border-gray-300 text-gray-500'}`}
                disabled
              />
            )}

            <div className={`flex items-center justify-between mt-4 pt-4 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <label className={`flex items-center gap-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                <input
                  type="checkbox"
                  checked={field.required}
                  onChange={(e) => updateField(field.id, 'required', e.target.checked)}
                  className="rounded"
                />
                Required
              </label>

              <div className="flex gap-2">
                <button
                  onClick={() => duplicateField(field.id)}
                  className={`px-3 py-1 text-sm rounded ${isDarkMode ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  Duplicate
                </button>
                <button
                  onClick={() => deleteField(field.id)}
                  className={`p-2 rounded ${isDarkMode ? 'text-red-400 hover:bg-red-900/20' : 'text-red-600 hover:bg-red-50'}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  const renderFieldPreview = (field) => {
    return (
      <div key={field.id} className="mb-6">
        <label className="block mb-2">
          <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{field.label}</span>
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        {field.description && (
          <p className={`text-sm mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{field.description}</p>
        )}

        {field.type === 'text' || field.type === 'email' ? (
          <input
            type={field.type}
            className={`w-full border rounded px-3 py-2 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
            placeholder={field.placeholder || 'Your answer'}
          />
        ) : field.type === 'textarea' ? (
          <textarea
            className={`w-full border rounded px-3 py-2 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
            rows="4"
            placeholder={field.placeholder || 'Your answer'}
          />
        ) : field.type === 'number' ? (
          <input
            type="number"
            className={`w-full border rounded px-3 py-2 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
            placeholder={field.placeholder || '0'}
          />
        ) : field.type === 'radio' ? (
          <div className="space-y-2">
            {field.options.map((option, idx) => (
              <label key={idx} className={`flex items-center gap-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                <input type="radio" name={`field-${field.id}`} />
                <span>{option}</span>
              </label>
            ))}
          </div>
        ) : field.type === 'checkbox' ? (
          <div className="space-y-2">
            {field.options.map((option, idx) => (
              <label key={idx} className={`flex items-center gap-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                <input type="checkbox" />
                <span>{option}</span>
              </label>
            ))}
          </div>
        ) : field.type === 'dropdown' ? (
          <select className={`w-full border rounded px-3 py-2 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}>
            <option value="">Choose</option>
            {field.options.map((option, idx) => (
              <option key={idx} value={option}>{option}</option>
            ))}
          </select>
        ) : (field.type === 'file' || field.type === 'video' || field.type === 'media') ? (
          <div>
            <input
              type="file"
              accept={field.allowedFileTypes.join(',')}
              className={`w-full border rounded px-3 py-2 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
            />
            <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
              Allowed: {field.allowedFileTypes.join(', ')}
            </p>
          </div>
        ) : null}
      </div>
    );
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-blue-50 to-indigo-100'}`}>
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} rounded-xl shadow-lg p-6 mb-6 border`}>
          <div className="flex items-center justify-between mb-4">
            <input
              type="text"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              className={`text-3xl font-bold outline-none border-b-2 border-transparent hover:border-gray-300 focus:border-blue-500 px-2 ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}
              placeholder="Form Title"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setPreviewMode(!previewMode)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  previewMode 
                    ? 'bg-blue-600 text-white' 
                    : isDarkMode 
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {previewMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {previewMode ? 'Edit' : 'Preview'}
              </button>
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Save className="w-4 h-4" />
                Save
              </button>
            </div>
          </div>
          <input
            type="text"
            value={formDescription}
            onChange={(e) => setFormDescription(e.target.value)}
            className={`w-full outline-none border-b border-transparent hover:border-gray-300 focus:border-blue-500 px-2 py-1 ${isDarkMode ? 'bg-gray-800 text-gray-400' : 'bg-white text-gray-600'}`}
            placeholder="Form description"
          />
        </div>

        {/* Main Content */}
        <div>
          {fields.length === 0 && !previewMode ? (
            <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} rounded-xl shadow-lg p-12 text-center mb-4 border`}>
              <Plus className={`w-16 h-16 mx-auto mb-4 ${isDarkMode ? 'text-gray-600' : 'text-gray-300'}`} />
              <h3 className={`text-xl font-semibold mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`}>No fields yet</h3>
              <p className={`${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Click the + button below to add your first field</p>
            </div>
          ) : previewMode ? (
            <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} rounded-xl shadow-lg p-8 border`}>
              <h2 className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{formTitle}</h2>
              {formDescription && (
                <p className={`mb-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{formDescription}</p>
              )}
              <div>
                {fields.map(renderFieldPreview)}
                <button
                  onClick={(e) => e.preventDefault()}
                  className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Submit
                </button>
              </div>
            </div>
          ) : (
            <AnimatePresence>
              <div>
                {fields.map(renderFieldEditor)}
              </div>
            </AnimatePresence>
          )}

          {/* Add Field Button */}
          {!previewMode && (
            <div className="relative">
              <button
                onClick={() => setShowFieldPicker(!showFieldPicker)}
                className={`w-full rounded-xl shadow-lg p-4 flex items-center justify-center gap-2 transition-all border-2 border-dashed ${
                  isDarkMode 
                    ? 'bg-gray-800 border-blue-500 text-blue-400 hover:bg-gray-750' 
                    : 'bg-white border-blue-300 text-blue-600 hover:bg-blue-50 hover:border-blue-500'
                }`}
              >
                <Plus className="w-6 h-6" />
                <span className="font-medium">Add Field</span>
              </button>

              {/* Field Picker Popup */}
              <AnimatePresence>
                {showFieldPicker && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={`absolute left-0 right-0 mt-2 rounded-xl shadow-2xl p-4 z-50 border-2 ${
                      isDarkMode 
                        ? 'bg-gray-800 border-blue-500' 
                        : 'bg-white border-blue-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>Choose a field type</h3>
                      <button
                        onClick={() => setShowFieldPicker(false)}
                        className={`p-1 rounded ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                      >
                        <X className={`w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {fieldTypes.map(ft => {
                        const Icon = ft.icon;
                        return (
                          <button
                            key={ft.id}
                            onClick={() => addField(ft.id)}
                            className={`flex items-center gap-3 p-3 text-left rounded-lg border transition-all ${
                              isDarkMode 
                                ? 'border-gray-700 hover:bg-gray-700 hover:border-blue-500' 
                                : 'border-gray-200 hover:bg-blue-50 hover:border-blue-400'
                            }`}
                          >
                            <Icon className={`w-5 h-5 ${ft.color}`} />
                            <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{ft.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* Backdrop for closing popup */}
      {showFieldPicker && (
        <div
          className="fixed inset-0 bg-black bg-opacity-20 z-40"
          onClick={() => setShowFieldPicker(false)}
        />
      )}
    </div>
  );
};

export default FormBuilder;
