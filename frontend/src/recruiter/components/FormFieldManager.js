import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Edit3, 
  Trash2, 
  GripVertical, 
  Save, 
  X,
  Type,
  FileText,
  List,
  Radio,
  CheckSquare,
  Mail,
  Hash,
  Calendar,
  Upload,
  Eye,
  EyeOff
} from 'lucide-react';

// Inline Form Builder Interface Component
const FormBuilderInterface = ({ round, onUpdate, isDarkMode }) => {
  const [fields, setFields] = useState(round.formFields || []);
  const [draggedItem, setDraggedItem] = useState(null);
  const [showFieldPicker, setShowFieldPicker] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  const fieldTypes = [
    { id: 'text', label: 'Short Text', icon: Type },
    { id: 'textarea', label: 'Long Text', icon: FileText },
    { id: 'email', label: 'Email', icon: Mail },
    { id: 'number', label: 'Number', icon: Hash },
    { id: 'radio', label: 'Radio Buttons', icon: Radio },
    { id: 'checkbox', label: 'Checkboxes', icon: CheckSquare },
    { id: 'select', label: 'Dropdown', icon: List },
    { id: 'file', label: 'File Upload', icon: Upload },
    { id: 'date', label: 'Date', icon: Calendar },
  ];

  const addField = (type) => {
    const newField = {
      id: `field_${Date.now()}`,
      type,
      label: `New ${type} field`,
      placeholder: '',
      required: false,
      options: ['radio', 'checkbox', 'select'].includes(type) ? ['Option 1', 'Option 2'] : [],
      order: fields.length + 1
    };
    const updatedFields = [...fields, newField];
    setFields(updatedFields);
    updateRound(updatedFields);
    setShowFieldPicker(false);
  };

  const updateField = (id, key, value) => {
    const updatedFields = fields.map(f => f.id === id ? { ...f, [key]: value } : f);
    setFields(updatedFields);
    updateRound(updatedFields);
  };

  const deleteField = (id) => {
    const updatedFields = fields.filter(f => f.id !== id);
    setFields(updatedFields);
    updateRound(updatedFields);
  };

  const updateRound = (updatedFields) => {
    onUpdate({ ...round, formFields: updatedFields });
  };

  const handleDragStart = (e, id) => {
    setDraggedItem(id);
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
      updateRound(newFields);
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

  return (
    <div className="space-y-4">
      {/* Preview Toggle */}
      <div className="flex justify-end">
        <button
          onClick={() => setPreviewMode(!previewMode)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            previewMode 
              ? 'bg-blue-600 text-white' 
              : isDarkMode 
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          {previewMode ? <><EyeOff className="w-4 h-4" /> Edit</> : <><Eye className="w-4 h-4" /> Preview</>}
        </button>
      </div>

      {/* Fields Area */}
      {fields.length === 0 && !previewMode ? (
        <div className={`p-12 rounded-xl border-2 border-dashed text-center ${
          isDarkMode ? 'border-gray-600 bg-gray-700/30' : 'border-gray-300 bg-gray-50'
        }`}>
          <Plus className={`w-16 h-16 mx-auto mb-4 ${isDarkMode ? 'text-gray-600' : 'text-gray-300'}`} />
          <h3 className={`text-xl font-semibold mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`}>No fields yet</h3>
          <p className={`${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Click the + button below to add your first field</p>
        </div>
      ) : previewMode ? (
        <div className={`p-8 rounded-xl ${isDarkMode ? 'bg-gray-700/50' : 'bg-white'}`}>
          <h2 className={`text-2xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Form Preview</h2>
          <div className="space-y-6">
            {fields.map(field => (
              <div key={field.id}>
                <label className={`block mb-2 font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                {field.type === 'text' || field.type === 'email' ? (
                  <input type={field.type} className={`w-full px-3 py-2 rounded-lg border ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`} placeholder={field.placeholder} />
                ) : field.type === 'textarea' ? (
                  <textarea className={`w-full px-3 py-2 rounded-lg border ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`} rows="4" placeholder={field.placeholder} />
                ) : field.type === 'number' ? (
                  <input type="number" className={`w-full px-3 py-2 rounded-lg border ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`} />
                ) : field.type === 'date' ? (
                  <input type="date" className={`w-full px-3 py-2 rounded-lg border ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`} />
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
                ) : field.type === 'select' ? (
                  <select className={`w-full px-3 py-2 rounded-lg border ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}>
                    <option>Choose...</option>
                    {field.options.map((option, idx) => (
                      <option key={idx}>{option}</option>
                    ))}
                  </select>
                ) : field.type === 'file' ? (
                  <input type="file" className={`w-full px-3 py-2 rounded-lg border ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`} />
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {fields.map(field => (
            <div
              key={field.id}
              draggable
              onDragStart={(e) => handleDragStart(e, field.id)}
              onDragOver={(e) => handleDragOver(e, field.id)}
              className={`p-4 rounded-lg border-2 hover:border-blue-400 transition-all ${
                isDarkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-white border-gray-200'
              }`}
            >
              <div className="flex items-start gap-3">
                <GripVertical className={`w-5 h-5 mt-2 cursor-move ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                <div className="flex-1">
                  <input
                    type="text"
                    value={field.label}
                    onChange={(e) => updateField(field.id, 'label', e.target.value)}
                    className={`w-full text-lg font-medium border-b-2 border-transparent hover:border-gray-300 focus:border-blue-500 outline-none px-2 py-1 mb-2 ${isDarkMode ? 'bg-gray-700/50 text-white' : 'bg-white text-gray-900'}`}
                    placeholder="Field label"
                  />
                  
                  {(['radio', 'checkbox', 'select'].includes(field.type)) && (
                    <div className="space-y-2 mt-3">
                      {field.options.map((option, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <span className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>{idx + 1}.</span>
                          <input
                            type="text"
                            value={option}
                            onChange={(e) => updateOption(field.id, idx, e.target.value)}
                            className={`flex-1 border-b px-2 py-1 text-sm ${isDarkMode ? 'bg-gray-700/50 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                          />
                          {field.options.length > 1 && (
                            <button onClick={() => removeOption(field.id, idx)} className="text-red-500 hover:text-red-700">
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                      <button onClick={() => addOption(field.id)} className="text-blue-600 text-sm hover:text-blue-800 flex items-center gap-1">
                        <Plus className="w-4 h-4" /> Add option
                      </button>
                    </div>
                  )}

                  <div className={`flex items-center justify-between mt-4 pt-4 border-t ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                    <label className={`flex items-center gap-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      <input
                        type="checkbox"
                        checked={field.required}
                        onChange={(e) => updateField(field.id, 'required', e.target.checked)}
                        className="rounded"
                      />
                      Required
                    </label>
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
          ))}
        </div>
      )}

      {/* Add Field Button */}
      {!previewMode && (
        <div className="relative">
          <button
            onClick={() => setShowFieldPicker(!showFieldPicker)}
            className={`w-full rounded-xl p-4 flex items-center justify-center gap-2 transition-all border-2 border-dashed ${
              isDarkMode 
                ? 'bg-gray-700/50 border-blue-500 text-blue-400 hover:bg-gray-700' 
                : 'bg-white border-blue-300 text-blue-600 hover:bg-blue-50 hover:border-blue-500'
            }`}
          >
            <Plus className="w-6 h-6" />
            <span className="font-medium">Add Field</span>
          </button>

          {/* Field Picker Popup */}
          {showFieldPicker && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowFieldPicker(false)}
              />
              <div className={`absolute left-0 right-0 mt-2 rounded-xl shadow-2xl p-4 z-50 border-2 ${
                isDarkMode ? 'bg-gray-800 border-blue-500' : 'bg-white border-blue-200'
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>Choose a field type</h3>
                  <button onClick={() => setShowFieldPicker(false)} className={`p-1 rounded ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
                    <X className={`w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {fieldTypes.map(ft => {
                    const Icon = ft.icon;
                    return (
                      <button
                        key={ft.id}
                        onClick={() => addField(ft.id)}
                        className={`flex items-center gap-2 p-3 text-left rounded-lg border transition-all ${
                          isDarkMode 
                            ? 'border-gray-700 hover:bg-gray-700 hover:border-blue-500' 
                            : 'border-gray-200 hover:bg-blue-50 hover:border-blue-400'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{ft.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

const FormFieldManager = ({ round, onUpdate, isDarkMode }) => {
  const [showAddFieldModal, setShowAddFieldModal] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [showFormBuilder, setShowFormBuilder] = useState(false);
  const [draggedFieldIndex, setDraggedFieldIndex] = useState(null);
  const [newField, setNewField] = useState({
    type: 'text',
    label: '',
    placeholder: '',
    required: false,
    options: [],
    validation: {
      minLength: null,
      maxLength: null,
      min: null,
      max: null,
      pattern: ''
    }
  });

  const fieldTypes = [
    { value: 'text', label: 'Text Input', icon: Type },
    { value: 'textarea', label: 'Text Area', icon: FileText },
    { value: 'email', label: 'Email', icon: Mail },
    { value: 'number', label: 'Number', icon: Hash },
    { value: 'date', label: 'Date', icon: Calendar },
    { value: 'select', label: 'Dropdown', icon: List },
    { value: 'radio', label: 'Radio Buttons', icon: Radio },
    { value: 'checkbox', label: 'Checkboxes', icon: CheckSquare },
    { value: 'file', label: 'File Upload', icon: Upload }
  ];

  const handleAddField = () => {
    setNewField({
      type: 'text',
      label: '',
      placeholder: '',
      required: false,
      options: [],
      validation: {
        minLength: null,
        maxLength: null,
        min: null,
        max: null,
        pattern: ''
      }
    });
    setEditingField(null);
    setShowAddFieldModal(true);
  };

  const handleEditField = (field) => {
    setNewField({ ...field });
    setEditingField(field);
    setShowAddFieldModal(true);
  };

  const handleSaveField = () => {
    if (!newField.label.trim()) {
      alert('Please enter a field label');
      return;
    }

    if (['select', 'radio', 'checkbox'].includes(newField.type) && newField.options.length === 0) {
      alert('Please add at least one option for this field type');
      return;
    }

    const fieldData = {
      id: editingField ? editingField.id : `field_${Date.now()}`,
      type: newField.type,
      label: newField.label,
      placeholder: newField.placeholder,
      required: newField.required,
      options: newField.options,
      validation: newField.validation,
      order: editingField ? editingField.order : (round.formFields?.length || 0) + 1
    };

    const updatedRound = { ...round };
    if (!updatedRound.formFields) {
      updatedRound.formFields = [];
    }

    if (editingField) {
      const fieldIndex = updatedRound.formFields.findIndex(f => f.id === editingField.id);
      if (fieldIndex !== -1) {
        updatedRound.formFields[fieldIndex] = fieldData;
      }
    } else {
      updatedRound.formFields.push(fieldData);
    }

    console.log('FormFieldManager: Updating round with form fields:', updatedRound);
    console.log('FormFieldManager: Round type:', updatedRound.type);
    console.log('FormFieldManager: Form fields count:', updatedRound.formFields?.length || 0);
    onUpdate(updatedRound);
    setShowAddFieldModal(false);
    setEditingField(null);
  };

  const handleDeleteField = (fieldId) => {
    if (window.confirm('Are you sure you want to delete this field?')) {
      const updatedRound = { ...round };
      updatedRound.formFields = updatedRound.formFields.filter(f => f.id !== fieldId);
      // Reorder remaining fields
      updatedRound.formFields.forEach((field, index) => {
        field.order = index + 1;
      });
      onUpdate(updatedRound);
    }
  };

  const handleMoveField = (fieldId, direction) => {
    const updatedRound = { ...round };
    const fieldIndex = updatedRound.formFields.findIndex(f => f.id === fieldId);
    
    if (direction === 'up' && fieldIndex > 0) {
      [updatedRound.formFields[fieldIndex], updatedRound.formFields[fieldIndex - 1]] = 
      [updatedRound.formFields[fieldIndex - 1], updatedRound.formFields[fieldIndex]];
    } else if (direction === 'down' && fieldIndex < updatedRound.formFields.length - 1) {
      [updatedRound.formFields[fieldIndex], updatedRound.formFields[fieldIndex + 1]] = 
      [updatedRound.formFields[fieldIndex + 1], updatedRound.formFields[fieldIndex]];
    }

    // Update order numbers
    updatedRound.formFields.forEach((field, index) => {
      field.order = index + 1;
    });

    onUpdate(updatedRound);
  };

  const addOption = () => {
    setNewField(prev => ({
      ...prev,
      options: [...prev.options, '']
    }));
  };

  const updateOption = (index, value) => {
    setNewField(prev => ({
      ...prev,
      options: prev.options.map((option, i) => i === index ? value : option)
    }));
  };

  const removeOption = (index) => {
    setNewField(prev => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index)
    }));
  };

  const getFieldIcon = (type) => {
    const fieldType = fieldTypes.find(ft => ft.value === type);
    return fieldType ? fieldType.icon : Type;
  };

  const getFieldTypeLabel = (type) => {
    const fieldType = fieldTypes.find(ft => ft.value === type);
    return fieldType ? fieldType.label : 'Text Input';
  };

  // Toggle form builder view
  const toggleFormBuilder = () => {
    setShowFormBuilder(!showFormBuilder);
  };

  // If form builder is active, show full builder interface
  if (showFormBuilder) {
    return (
      <div className={`rounded-xl ${isDarkMode ? 'bg-gray-800/50' : 'bg-white'} p-6`}>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h4 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Form Builder
            </h4>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Design your custom form with drag-and-drop fields
            </p>
          </div>
          <button
            onClick={toggleFormBuilder}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              isDarkMode
                ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
            }`}
          >
            ← Back to List
          </button>
        </div>
        
        {/* Full Form Builder Interface */}
        <FormBuilderInterface 
          round={round}
          onUpdate={onUpdate}
          isDarkMode={isDarkMode}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Form Fields Header */}
      <div className="flex justify-between items-center">
        <div>
          <h4 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Form Fields ({round.formFields?.length || 0})
          </h4>
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Create custom form fields for candidates to fill out
          </p>
        </div>
        <div className="flex gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleFormBuilder}
            className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            Open Form Builder
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleAddField}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Field
          </motion.button>
        </div>
      </div>

      {/* Form Fields List */}
      {(!round.formFields || round.formFields.length === 0) ? (
        <div className={`p-6 rounded-lg border-2 border-dashed ${
          isDarkMode 
            ? 'border-gray-600 bg-gray-700/30' 
            : 'border-gray-300 bg-gray-50'
        }`}>
          <div className="text-center">
            <FileText className={`w-12 h-12 mx-auto mb-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
            <h3 className={`text-lg font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              No Form Fields Yet
            </h3>
            <p className={`text-sm mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Add form fields to create a custom form for candidates to fill out.
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleAddField}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center gap-2 mx-auto"
            >
              <Plus className="w-4 h-4" />
              Add First Field
            </motion.button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {round.formFields
            .sort((a, b) => a.order - b.order)
            .map((field, index) => {
              const IconComponent = getFieldIcon(field.type);
              return (
                <motion.div
                  key={field.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-4 rounded-lg border-l-4 border-blue-500 ${
                    isDarkMode 
                      ? 'bg-gray-700/50 border-gray-600' 
                      : 'bg-blue-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="flex flex-col gap-1">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleMoveField(field.id, 'up')}
                          disabled={index === 0}
                          className={`p-1 rounded ${
                            index === 0 
                              ? 'text-gray-400 cursor-not-allowed' 
                              : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                          }`}
                        >
                          <GripVertical className="w-4 h-4 rotate-180" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleMoveField(field.id, 'down')}
                          disabled={index === round.formFields.length - 1}
                          className={`p-1 rounded ${
                            index === round.formFields.length - 1 
                              ? 'text-gray-400 cursor-not-allowed' 
                              : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                          }`}
                        >
                          <GripVertical className="w-4 h-4" />
                        </motion.button>
                      </div>
                      
                      <div className="p-2 bg-blue-100 rounded-full">
                        <IconComponent className="w-4 h-4 text-blue-600" />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {field.label}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            field.required 
                              ? 'bg-red-100 text-red-700' 
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {field.required ? 'Required' : 'Optional'}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700`}>
                            {getFieldTypeLabel(field.type)}
                          </span>
                        </div>
                        {field.placeholder && (
                          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            Placeholder: {field.placeholder}
                          </p>
                        )}
                        {field.options && field.options.length > 0 && (
                          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            Options: {field.options.join(', ')}
                          </p>
                        )}
                        {field.validation && (
                          <div className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                            {field.validation.minLength && `Min: ${field.validation.minLength} `}
                            {field.validation.maxLength && `Max: ${field.validation.maxLength} `}
                            {field.validation.pattern && `Pattern: ${field.validation.pattern}`}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleEditField(field)}
                        className="p-2 text-blue-500 hover:text-blue-600 transition-colors duration-200"
                      >
                        <Edit3 className="w-4 h-4" />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleDeleteField(field.id)}
                        className="p-2 text-red-500 hover:text-red-600 transition-colors duration-200"
                      >
                        <Trash2 className="w-4 h-4" />
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
        </div>
      )}

      {/* Add/Edit Field Modal */}
      <AnimatePresence>
        {showAddFieldModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`p-6 rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto ${
                isDarkMode ? 'bg-gray-800' : 'bg-white'
              }`}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {editingField ? 'Edit Form Field' : 'Add Form Field'}
                </h3>
                <button
                  onClick={() => setShowAddFieldModal(false)}
                  className={`p-2 rounded-lg transition-colors duration-200 ${
                    isDarkMode 
                      ? 'hover:bg-gray-700 text-gray-300' 
                      : 'hover:bg-gray-100 text-gray-600'
                  }`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Field Type */}
                <div>
                  <label className={`block text-sm font-medium mb-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Field Type *
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {fieldTypes.map((fieldType) => {
                      const IconComponent = fieldType.icon;
                      return (
                        <motion.button
                          key={fieldType.value}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setNewField(prev => ({ ...prev, type: fieldType.value }))}
                          className={`p-4 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-2 ${
                            newField.type === fieldType.value
                              ? isDarkMode
                                ? 'border-blue-500 bg-blue-500/20 text-blue-400'
                                : 'border-blue-500 bg-blue-50 text-blue-700'
                              : isDarkMode
                                ? 'border-gray-600 bg-gray-700/50 text-gray-300 hover:border-blue-400 hover:bg-gray-700'
                                : 'border-gray-300 bg-white text-gray-700 hover:border-blue-400 hover:bg-gray-50'
                          }`}
                        >
                          <IconComponent className="w-6 h-6" />
                          <span className="text-xs font-medium text-center leading-tight">{fieldType.label}</span>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                {/* Field Label */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Field Label *
                  </label>
                  <input
                    type="text"
                    value={newField.label}
                    onChange={(e) => setNewField(prev => ({ ...prev, label: e.target.value }))}
                    className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                    placeholder="e.g., Full Name, Email Address, Experience Level"
                  />
                </div>

                {/* Placeholder */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Placeholder Text
                  </label>
                  <input
                    type="text"
                    value={newField.placeholder}
                    onChange={(e) => setNewField(prev => ({ ...prev, placeholder: e.target.value }))}
                    className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                    placeholder="Enter placeholder text..."
                  />
                </div>

                {/* Options for select, radio, checkbox */}
                {['select', 'radio', 'checkbox'].includes(newField.type) && (
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Options *
                    </label>
                    <div className="space-y-2">
                      {newField.options.map((option, index) => (
                        <div key={index} className="flex gap-2">
                          <input
                            type="text"
                            value={option}
                            onChange={(e) => updateOption(index, e.target.value)}
                            className={`flex-1 px-3 py-2 rounded-lg border ${
                              isDarkMode 
                                ? 'bg-gray-700 border-gray-600 text-white' 
                                : 'bg-white border-gray-300 text-gray-900'
                            }`}
                            placeholder={`Option ${index + 1}`}
                          />
                          <button
                            onClick={() => removeOption(index)}
                            className="p-2 text-red-500 hover:text-red-600 transition-colors duration-200"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={addOption}
                        className="w-full p-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-700 transition-colors duration-200 flex items-center justify-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Add Option
                      </button>
                    </div>
                  </div>
                )}

                {/* Validation Rules */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Validation Rules
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {['text', 'textarea', 'email'].includes(newField.type) && (
                      <>
                        <div>
                          <label className={`block text-xs mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            Min Length
                          </label>
                          <input
                            type="number"
                            value={newField.validation.minLength || ''}
                            onChange={(e) => setNewField(prev => ({
                              ...prev,
                              validation: { ...prev.validation, minLength: e.target.value ? parseInt(e.target.value) : null }
                            }))}
                            className={`w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                              isDarkMode 
                                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                            }`}
                            min="0"
                          />
                        </div>
                        <div>
                          <label className={`block text-xs mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            Max Length
                          </label>
                          <input
                            type="number"
                            value={newField.validation.maxLength || ''}
                            onChange={(e) => setNewField(prev => ({
                              ...prev,
                              validation: { ...prev.validation, maxLength: e.target.value ? parseInt(e.target.value) : null }
                            }))}
                            className={`w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                              isDarkMode 
                                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                            }`}
                            min="0"
                          />
                        </div>
                      </>
                    )}
                    {newField.type === 'number' && (
                      <>
                        <div>
                          <label className={`block text-xs mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            Min Value
                          </label>
                          <input
                            type="number"
                            value={newField.validation.min || ''}
                            onChange={(e) => setNewField(prev => ({
                              ...prev,
                              validation: { ...prev.validation, min: e.target.value ? parseFloat(e.target.value) : null }
                            }))}
                            className={`w-full px-3 py-2 rounded-lg border ${
                              isDarkMode 
                                ? 'bg-gray-700 border-gray-600 text-white' 
                                : 'bg-white border-gray-300 text-gray-900'
                            }`}
                          />
                        </div>
                        <div>
                          <label className={`block text-xs mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            Max Value
                          </label>
                          <input
                            type="number"
                            value={newField.validation.max || ''}
                            onChange={(e) => setNewField(prev => ({
                              ...prev,
                              validation: { ...prev.validation, max: e.target.value ? parseFloat(e.target.value) : null }
                            }))}
                            className={`w-full px-3 py-2 rounded-lg border ${
                              isDarkMode 
                                ? 'bg-gray-700 border-gray-600 text-white' 
                                : 'bg-white border-gray-300 text-gray-900'
                            }`}
                          />
                        </div>
                      </>
                    )}
                  </div>
                  <div className="mt-3">
                    <label className={`block text-xs mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Regex Pattern (optional)
                    </label>
                    <input
                      type="text"
                      value={newField.validation.pattern || ''}
                      onChange={(e) => setNewField(prev => ({
                        ...prev,
                        validation: { ...prev.validation, pattern: e.target.value }
                      }))}
                      className={`w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                        isDarkMode 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      }`}
                      placeholder="e.g., ^[0-9]{10}$ for 10-digit phone number"
                    />
                  </div>
                </div>

                {/* Required Field */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="required"
                    checked={newField.required}
                    onChange={(e) => setNewField(prev => ({ ...prev, required: e.target.checked }))}
                    className="rounded"
                  />
                  <label htmlFor="required" className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Required field
                  </label>
                </div>

                {/* Action Buttons */}
                <div className={`flex gap-3 pt-4 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSaveField}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30"
                  >
                    <Save className="w-5 h-5" />
                    {editingField ? 'Update Field' : 'Add Field'}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowAddFieldModal(false)}
                    className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                      isDarkMode
                        ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                    }`}
                  >
                    Cancel
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FormFieldManager;
