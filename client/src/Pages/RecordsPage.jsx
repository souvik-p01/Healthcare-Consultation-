import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Shield,
  ChevronLeft,
  FileText,
  Download,
  Upload,
  Share2,
  Lock,
  Eye,
  EyeOff,
  Search,
  Filter,
  Calendar,
  User,
  Hospital,
  AlertCircle,
  CheckCircle,
  Plus,
  X,
  BarChart,
  Clock
} from 'lucide-react'

const RecordsPage = () => {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [shareModal, setShareModal] = useState(false)
  const [uploadModal, setUploadModal] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [accessLogs, setAccessLogs] = useState([
    { id: 1, doctor: 'Dr. Sarah Johnson', date: '2024-01-15', time: '10:30 AM', action: 'Viewed' },
    { id: 2, doctor: 'Dr. Michael Chen', date: '2024-01-10', time: '02:15 PM', action: 'Downloaded' },
    { id: 3, doctor: 'Dr. Priya Sharma', date: '2024-01-05', time: '11:45 AM', action: 'Viewed' }
  ])

  const categories = [
    { id: 'all', name: 'All Records', count: 24 },
    { id: 'prescriptions', name: 'Prescriptions', count: 8 },
    { id: 'lab-reports', name: 'Lab Reports', count: 6 },
    { id: 'medical-history', name: 'Medical History', count: 4 },
    { id: 'vaccination', name: 'Vaccination', count: 3 },
    { id: 'insurance', name: 'Insurance', count: 3 }
  ]

  const records = [
    {
      id: 1,
      title: 'Blood Test Report',
      category: 'lab-reports',
      date: '2024-01-15',
      doctor: 'Dr. Sarah Johnson',
      hospital: 'Apollo Hospital',
      size: '2.4 MB',
      type: 'PDF',
      encrypted: true,
      sharedWith: ['Dr. Michael Chen']
    },
    {
      id: 2,
      title: 'ECG Report',
      category: 'lab-reports',
      date: '2024-01-10',
      doctor: 'Dr. Robert Kim',
      hospital: 'Fortis Hospital',
      size: '1.8 MB',
      type: 'PDF',
      encrypted: true,
      sharedWith: []
    },
    {
      id: 3,
      title: 'Diabetes Prescription',
      category: 'prescriptions',
      date: '2024-01-08',
      doctor: 'Dr. Priya Sharma',
      hospital: 'Kokilaben Hospital',
      size: '0.5 MB',
      type: 'PDF',
      encrypted: true,
      sharedWith: ['Dr. Sarah Johnson']
    },
    {
      id: 4,
      title: 'X-Ray - Chest',
      category: 'lab-reports',
      date: '2024-01-05',
      doctor: 'Dr. James Wilson',
      hospital: 'Lilavati Hospital',
      size: '5.2 MB',
      type: 'DICOM',
      encrypted: true,
      sharedWith: []
    },
    {
      id: 5,
      title: 'Medical History Summary',
      category: 'medical-history',
      date: '2024-01-01',
      doctor: 'Dr. Sarah Johnson',
      hospital: 'Apollo Hospital',
      size: '1.2 MB',
      type: 'PDF',
      encrypted: true,
      sharedWith: ['Dr. Michael Chen', 'Dr. Priya Sharma']
    },
    {
      id: 6,
      title: 'COVID-19 Vaccination',
      category: 'vaccination',
      date: '2023-12-20',
      doctor: 'Community Health Center',
      hospital: 'Government Hospital',
      size: '0.8 MB',
      type: 'PDF',
      encrypted: true,
      sharedWith: []
    }
  ]

  const doctors = [
    { id: 1, name: 'Dr. Sarah Johnson', specialty: 'Cardiology' },
    { id: 2, name: 'Dr. Michael Chen', specialty: 'Neurology' },
    { id: 3, name: 'Dr. Priya Sharma', specialty: 'Pediatrics' },
    { id: 4, name: 'Dr. James Wilson', specialty: 'Orthopedics' }
  ]

  const filteredRecords = selectedCategory === 'all'
    ? records
    : records.filter(record => record.category === selectedCategory)

  const handleShare = (recordId) => {
    const record = records.find(r => r.id === recordId)
    setSelectedRecord(record)
    setShareModal(true)
  }

  const handleDownload = (recordId) => {
    alert('Download initiated for record #' + recordId)
    // In real app, this would trigger file download
  }

  const handleView = (recordId) => {
    alert('Viewing record #' + recordId)
    // In real app, this would open the document viewer
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        <Link 
          to="/services"
          className="inline-flex items-center text-gray-600 hover:text-gray-700 mb-6 bg-white px-4 py-2 rounded-full shadow"
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back to Services
        </Link>

        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 mb-8">
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-r from-gray-500 to-slate-600 p-3 rounded-xl text-white">
                <Shield className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-800">Secure Medical Records</h1>
                <p className="text-gray-600">Military-grade encryption for your health data</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <button
                onClick={() => setUploadModal(true)}
                className="flex items-center gap-2 bg-gray-800 text-white px-6 py-3 rounded-lg hover:bg-gray-900"
              >
                <Upload className="w-5 h-5" />
                Upload Records
              </button>
            </div>
          </div>

          {/* Security Status */}
          <div className="grid md:grid-cols-4 gap-4 mb-8">
            <div className="bg-gray-50 border rounded-xl p-4 text-center">
              <Lock className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <div className="text-sm text-gray-600">Encryption</div>
              <div className="font-bold text-gray-800">AES-256</div>
            </div>
            <div className="bg-gray-50 border rounded-xl p-4 text-center">
              <Eye className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <div className="text-sm text-gray-600">Access Logs</div>
              <div className="font-bold text-gray-800">{accessLogs.length}</div>
            </div>
            <div className="bg-gray-50 border rounded-xl p-4 text-center">
              <FileText className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <div className="text-sm text-gray-600">Total Records</div>
              <div className="font-bold text-gray-800">{records.length}</div>
            </div>
            <div className="bg-gray-50 border rounded-xl p-4 text-center">
              <Calendar className="w-8 h-8 text-orange-600 mx-auto mb-2" />
              <div className="text-sm text-gray-600">Last Updated</div>
              <div className="font-bold text-gray-800">Today</div>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input 
                type="text" 
                placeholder="Search records by title, doctor, or hospital..."
                className="w-full pl-12 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
              />
            </div>
            <button className="flex items-center gap-2 border px-6 py-3 rounded-lg hover:bg-gray-50">
              <Filter className="w-5 h-5" />
              Filters
            </button>
          </div>

          {/* Categories */}
          <div className="mb-8">
            <div className="flex flex-wrap gap-3">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-4 py-2 rounded-full font-medium transition-all ${
                    selectedCategory === category.id
                      ? 'bg-gray-800 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {category.name}
                  <span className="ml-2 text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">
                    {category.count}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Records Grid */}
          <div className="flex-1">
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {filteredRecords.map((record) => (
                <div
                  key={record.id}
                  className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-bold text-lg text-gray-800">{record.title}</h3>
                          {record.encrypted && (
                            <Lock className="w-4 h-4 text-green-600" />
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-600 mb-3">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {record.date}
                          </span>
                          <span className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            {record.doctor}
                          </span>
                        </div>
                        <div className="text-sm text-gray-500 flex items-center gap-2">
                          <Hospital className="w-4 h-4" />
                          {record.hospital}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-500">{record.type}</div>
                        <div className="text-sm font-medium text-gray-700">{record.size}</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t">
                      <div className="text-sm">
                        {record.sharedWith.length > 0 ? (
                          <span className="text-gray-600">
                            Shared with {record.sharedWith.length} doctor(s)
                          </span>
                        ) : (
                          <span className="text-gray-400">Not shared</span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleView(record.id)}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                          title="View"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDownload(record.id)}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                          title="Download"
                        >
                          <Download className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleShare(record.id)}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                          title="Share"
                        >
                          <Share2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Access Logs */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                <Eye className="w-6 h-6 mr-3 text-gray-600" />
                Access Logs
              </h3>
              <div className="space-y-4">
                {accessLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-gray-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-800">{log.doctor}</h4>
                        <div className="flex items-center gap-3 text-sm text-gray-600">
                          <span>{log.date}</span>
                          <span className="flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            {log.time}
                          </span>
                        </div>
                      </div>
                    </div>
                    <span className={`text-xs px-3 py-1 rounded-full ${
                      log.action === 'Viewed'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-green-100 text-green-700'
                    }`}>
                      {log.action}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:w-96">
            {/* Security Features */}
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
              <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                <Shield className="w-6 h-6 mr-3" />
                Security Features
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Lock className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <div className="font-medium text-gray-800">Military-grade Encryption</div>
                    <p className="text-sm text-gray-600">AES-256 encryption for all stored data</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <EyeOff className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <div className="font-medium text-gray-800">Zero-Knowledge Architecture</div>
                    <p className="text-sm text-gray-600">We cannot access your encrypted data</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <BarChart className="w-5 h-5 text-purple-600 mt-0.5" />
                  <div>
                    <div className="font-medium text-gray-800">Blockchain Verification</div>
                    <p className="text-sm text-gray-600">Tamper-proof record verification</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5" />
                  <div>
                    <div className="font-medium text-gray-800">Real-time Alerts</div>
                    <p className="text-sm text-gray-600">Get notified when records are accessed</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-6">Storage Usage</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Used</span>
                    <span className="font-medium">11.9 MB / 1 GB</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-gray-800 h-2 rounded-full" style={{ width: '1.19%' }}></div>
                  </div>
                </div>
                <div className="text-sm text-gray-600">
                  <div className="flex justify-between py-2 border-b">
                    <span>Documents</span>
                    <span>9.1 MB</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span>Images</span>
                    <span>2.8 MB</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span>Available</span>
                    <span className="text-green-600">988.1 MB</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Share Modal */}
        {shareModal && selectedRecord && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">Share Record</h3>
                <button
                  onClick={() => setShareModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="mb-6">
                <div className="font-medium text-gray-800 mb-2">{selectedRecord.title}</div>
                <div className="text-sm text-gray-600">Select doctors to share with:</div>
              </div>
              
              <div className="space-y-3 mb-6">
                {doctors.map((doctor) => (
                  <label key={doctor.id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50">
                    <input type="checkbox" className="rounded text-gray-800" />
                    <div>
                      <div className="font-medium">{doctor.name}</div>
                      <div className="text-sm text-gray-600">{doctor.specialty}</div>
                    </div>
                  </label>
                ))}
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShareModal(false)}
                  className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    alert('Record shared successfully!')
                    setShareModal(false)
                  }}
                  className="flex-1 bg-gray-800 text-white py-3 rounded-lg hover:bg-gray-900"
                >
                  Share Record
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Upload Modal */}
        {uploadModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">Upload Medical Records</h3>
                <button
                  onClick={() => setUploadModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center mb-6">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <div className="font-medium text-gray-800 mb-2">Drop files here or click to upload</div>
                <div className="text-sm text-gray-600 mb-4">
                  Supports PDF, JPG, PNG, DICOM (Max 10MB each)
                </div>
                <label className="inline-block bg-gray-800 text-white px-6 py-2 rounded-lg hover:bg-gray-900 cursor-pointer">
                  Browse Files
                  <input type="file" multiple className="hidden" />
                </label>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Record Type
                  </label>
                  <select className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500">
                    <option>Select type</option>
                    <option>Prescription</option>
                    <option>Lab Report</option>
                    <option>Medical History</option>
                    <option>Vaccination Record</option>
                    <option>Insurance Document</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Doctor/Hospital
                  </label>
                  <input
                    type="text"
                    placeholder="Enter doctor or hospital name"
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date of Record
                  </label>
                  <input
                    type="date"
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                  />
                </div>
              </div>
              
              <div className="mt-8 flex gap-3">
                <button
                  onClick={() => setUploadModal(false)}
                  className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    alert('Records uploaded successfully!')
                    setUploadModal(false)
                  }}
                  className="flex-1 bg-gray-800 text-white py-3 rounded-lg hover:bg-gray-900"
                >
                  Upload & Encrypt
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default RecordsPage