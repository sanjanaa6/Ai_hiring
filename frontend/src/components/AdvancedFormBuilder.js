import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  X,
  Eye,
  Save,
  Image,
  Type,
  AlignLeft,
  List,
  Circle,
  CheckSquare,
  Calendar,
  Upload,
  Hash,
  Users,
  FileImage,
  Table
} from 'lucide-react';

const AdvancedFormBuilder = ({ isDarkMode = false }) => {
  const [formTitle, setFormTitle] = useState('Untitled Form');
  const [formDescription, setFormDescription] = useState('Form description');
  const [fields, setFields] = useState([]);
  const [showFieldPicker, setShowFieldPicker] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  const fieldTypes = [
    { id: 'image', label: 'Image', icon: Image, color: 'text-red-500' },
    { id: 'text', label: 'Short Text', icon: Type, color: 'text-purple-500' },
    { id: 'email', label: 'Email', icon: AlignLeft, color: 'text-blue-500' },
    { id: 'number', label: 'Number', icon: Hash, color: 'text-blue-400' },
    { id: 'dropdown', label: 'Dropdown', icon: List, color: 'text-purple-400' },
    { id: 'checkbox', label: 'Checkbox', icon: CheckSquare, color: 'text-purple-600' },
    { id: 'date', label: 'Date', icon: Calendar, color: 'text-gray-500' },
    { id: 'time', label: 'Time', icon: Calendar, color: 'text-gray-600' },
    { id: 'file', label: 'File Upload', icon: Upload, color: 'text-gray-700' },
    { id: 'user', label: 'User', icon: Users, color: 'text-black' },
    { id: 'media', label: 'Media', icon: FileImage, color: 'text-green-500' },
    { id: 'table', label: 'Table', icon: Table, color: 'text-blue-600' }
  ];

  const addField = (type) => {
    const fieldType = fieldTypes.find(ft => ft.id === type);
    const newField = {
      id: `field_${Date.now()}`,
      type,
      label: `${fieldType.label} Field`,
      placeholder: '',
      required: false,
      options: ['dropdown', 'checkbox'].includes(type) ? ['Option 1', 'Option 2'] : []
    };
    setFields([...fields, newField]);
    setShowFieldPicker(false);
  };

  const updateField = (id, key, value) => {
    setFields(fields.map(f => f.id === id ? { ...f, [key]: value } : f));
  };

  const deleteField = (id) => {
    setFields(fields.filter(f => f.id !== id));
  };

  const handleSave = () => {
    console.log('Form saved:', { formTitle, formDescription, fields });
    alert('Form saved successfully!');
  };

  return (
    <div className={`min-h-screen p-8 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
      <div className="max-w-4xl mx-auto">
        <div className={`rounded-xl shadow-lg p-8 mb-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="flex justify-between items-start mb-6">
            <div className="flex-1">
              <input
                type="text"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                className={`text-3xl font-bold w-full border-none outline-none mb-3 ${
                  isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
                }`}
                placeholder="Untitled Form"
              />
              <input
                type="text"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                className={`text-sm w-full border-none outline-none ${
                  isDarkMode ? 'bg-gray-800 text-gray-400' : 'bg-white text-gray-500'
                }`}
                placeholder="Form description"
              />
            </div>
            <div className="flex gap-3 ml-4">
              <button
                onClick={() => setPreviewMode(!previewMode)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  isDarkMode
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Eye className="w-4 h-4" />
                Preview
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
        </div>

        <div className={`rounded-xl shadow-lg p-8 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
          {fields.length === 0 ? (
            <div className="text-center py-16">
              <Plus className={`w-16 h-16 mx-auto mb-4 ${isDarkMode ? 'text-gray-600' : 'text-gray-300'}`} />
              <h3 className={`text-xl font-semibold mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                No fields yet
              </h3>
              <p className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                Click the + button below to add your first field
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {fields.map((field) => {
                const fieldType = fieldTypes.find(ft => ft.id === field.type);
                const Icon = fieldType?.icon || Type;
                return (
                  <motion.div
                    key={field.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className={`p-4 rounded-lg border ${
                      isDarkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Icon className={`w-5 h-5 mt-2 ${fieldType?.color || 'text-gray-500'}`} />
                      <div className="flex-1">
                        <input
                          type="text"
                          value={field.label}
                          onChange={(e) => updateField(field.id, 'label', e.target.value)}
                          className={`w-full text-lg font-medium border-b-2 border-transparent hover:border-gray-300 focus:border-blue-500 outline-none px-2 py-1 mb-2 ${
                            isDarkMode ? 'bg-gray-700/50 text-white' : 'bg-gray-50 text-gray-900'
                          }`}
                          placeholder="Field label"
                        />
                        <input
                          type="text"
                          value={field.placeholder}
                          onChange={(e) => updateField(field.id, 'placeholder', e.target.value)}
                          className={`w-full text-sm border-b border-transparent hover:border-gray-300 focus:border-blue-500 outline-none px-2 py-1 ${
                            isDarkMode ? 'bg-gray-700/50 text-gray-400' : 'bg-gray-50 text-gray-600'
                          }`}
                          placeholder="Placeholder text"
                        />
                        
                        {['dropdown', 'checkbox'].includes(field.type) && (
                          <div className="mt-3 space-y-2">
                            {field.options.map((option, idx) => (
                              <div key={idx} className="flex items-center gap-2">
                                <span className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                  {idx + 1}.
                                </span>
                                <input
                                  type="text"
                                  value={option}
                                  onChange={(e) => {
                                    const newOptions = [...field.options];
                                    newOptions[idx] = e.target.value;
                                    updateField(field.id, 'options', newOptions);
                                  }}
                                  className={`flex-1 border-b px-2 py-1 text-sm ${
                                    isDarkMode
                                      ? 'bg-gray-700/50 border-gray-600 text-white'
                                      : 'bg-white border-gray-300 text-gray-900'
                                  }`}
                                />
                                {field.options.length > 1 && (
                                  <button
                                    onClick={() => {
                                      const newOptions = field.options.filter((_, i) => i !== idx);
                                      updateField(field.id, 'options', newOptions);
                                    }}
                                    className="text-red-500 hover:text-red-700"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            ))}
                            <button
                              onClick={() => {
                                const newOptions = [...field.options, `Option ${field.options.length + 1}`];
                                updateField(field.id, 'options', newOptions);
                              }}
                              className="text-blue-600 text-sm hover:text-blue-800 flex items-center gap-1"
                            >
                              <Plus className="w-4 h-4" /> Add option
                            </button>
                          </div>
                        )}

                        <div className={`flex items-center justify-between mt-4 pt-4 border-t ${
                          isDarkMode ? 'border-gray-600' : 'border-gray-200'
                        }`}>
                          <label className={`flex items-center gap-2 text-sm ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-600'
                          }`}>
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
                            className="text-red-500 hover:text-red-700"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          <div className="relative mt-6">
            <button
              onClick={() => setShowFieldPicker(!showFieldPicker)}
              className={`w-full rounded-lg p-4 flex items-center justify-center gap-2 transition-all border-2 ${
                isDarkMode
                  ? 'bg-gray-700/50 border-blue-500 text-blue-400 hover:bg-gray-700'
                  : 'bg-white border-blue-400 text-blue-600 hover:bg-blue-50'
              }`}
            >
              <Plus className="w-5 h-5" />
              <span className="font-medium">Add Field</span>
            </button>

            <AnimatePresence>
              {showFieldPicker && (
                <>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-40"
                    onClick={() => setShowFieldPicker(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={`absolute left-0 right-0 mt-2 rounded-xl shadow-2xl p-6 z-50 border-2 ${
                      isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className={`font-semibold text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        Choose a field type
                      </h3>
                      <button
                        onClick={() => setShowFieldPicker(false)}
                        className={`p-1 rounded ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                      >
                        <X className={`w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                      </button>
                    </div>
                    <div className="grid grid-cols-4 gap-3">
                      {fieldTypes.map((ft) => {
                        const Icon = ft.icon;
                        return (
                          <motion.button
                            key={ft.id}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => addField(ft.id)}
                            className={`flex flex-col items-center justify-center gap-2 p-4 rounded-lg border transition-all ${
                              isDarkMode
                                ? 'border-gray-700 hover:bg-gray-700 hover:border-blue-500'
                                : 'border-gray-200 hover:bg-gray-50 hover:border-blue-400'
                            }`}
                          >
                            <Icon className={`w-8 h-8 ${ft.color}`} />
                            <span className={`text-xs font-medium text-center ${
                              isDarkMode ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                              {ft.label}
                            </span>
                          </motion.button>
                        );
                      })}
                    </div>
                    <div className="mt-4 pt-4 border-t flex justify-end">
                      <span className={`text-xs ${isDarkMode ? 'text-gray-500 border-gray-700' : 'text-gray-400 border-gray-200'}`}>
                        Switch Upload
                      </span>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>

        <AnimatePresence>
          {previewMode && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
              onClick={() => setPreviewMode(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className={`max-w-2xl w-full max-h-[90vh] overflow-y-auto rounded-xl shadow-2xl p-8 ${
                  isDarkMode ? 'bg-gray-800' : 'bg-white'
                }`}
              >
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {formTitle}
                    </h2>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {formDescription}
                    </p>
                  </div>
                  <button
                    onClick={() => setPreviewMode(false)}
                    className={`p-2 rounded-lg ${
                      isDarkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
                    }`}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-6">
                  {fields.map((field) => (
                    <div key={field.id}>
                      <label className={`block mb-2 font-medium ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        {field.label}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                      </label>
                      {field.type === 'text' || field.type === 'email' ? (
                        <input
                          type={field.type}
                          className={`w-full px-3 py-2 rounded-lg border ${
                            isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                          }`}
                          placeholder={field.placeholder}
                        />
                      ) : field.type === 'number' ? (
                        <input
                          type="number"
                          className={`w-full px-3 py-2 rounded-lg border ${
                            isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                          }`}
                        />
                      ) : field.type === 'date' || field.type === 'time' ? (
                        <input
                          type={field.type}
                          className={`w-full px-3 py-2 rounded-lg border ${
                            isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                          }`}
                        />
                      ) : field.type === 'dropdown' ? (
                        <select className={`w-full px-3 py-2 rounded-lg border ${
                          isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                        }`}>
                          <option>Choose...</option>
                          {field.options.map((option, idx) => (
                            <option key={idx}>{option}</option>
                          ))}
                        </select>
                      ) : field.type === 'checkbox' ? (
                        <div className="space-y-2">
                          {field.options.map((option, idx) => (
                            <label key={idx} className={`flex items-center gap-2 ${
                              isDarkMode ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                              <input type="checkbox" />
                              <span>{option}</span>
                            </label>
                          ))}
                        </div>
                      ) : field.type === 'file' ? (
                        <input
                          type="file"
                          className={`w-full px-3 py-2 rounded-lg border ${
                            isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                          }`}
                        />
                      ) : null}
                    </div>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AdvancedFormBuilder;
