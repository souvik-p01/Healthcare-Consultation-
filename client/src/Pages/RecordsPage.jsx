import React, { useState, useMemo, useRef } from 'react'
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
  Clock,
  ChevronDown,
  FileCheck,
  TrendingUp,
  MoreVertical,
  Trash2,
  Edit,
  Copy,
  ExternalLink,
  Users,
  Database,
  Key,
  QrCode,
  ShieldCheck,
  RefreshCw,
  FileUp,
  FileDown
} from 'lucide-react'

const RecordsPage = () => {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [shareModal, setShareModal] = useState(false)
  const [uploadModal, setUploadModal] = useState(false)
  const [viewModal, setViewModal] = useState(false)
  const [deleteModal, setDeleteModal] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedDoctors, setSelectedDoctors] = useState([])
  const [dateRange, setDateRange] = useState({ start: '', end: '' })
  const [sortBy, setSortBy] = useState('date-desc')
  const [activeTab, setActiveTab] = useState('records')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [selectedRecords, setSelectedRecords] = useState(new Set())
  const [uploadedFiles, setUploadedFiles] = useState([])
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef(null)
  
  const [uploadForm, setUploadForm] = useState({
    recordType: '',
    recordDate: '',
    doctorName: '',
    hospitalName: '',
    notes: ''
  })

  const [accessLogs, setAccessLogs] = useState([
    { id: 1, doctor: 'Dr. Sarah Johnson', date: '2024-01-15', time: '10:30 AM', action: 'Viewed', ip: '192.168.1.1', location: 'Hospital Network' },
    { id: 2, doctor: 'Dr. Michael Chen', date: '2024-01-10', time: '02:15 PM', action: 'Downloaded', ip: '10.0.0.45', location: 'Clinic Office' },
    { id: 3, doctor: 'Dr. Priya Sharma', date: '2024-01-05', time: '11:45 AM', action: 'Viewed', ip: '172.16.0.3', location: 'Mobile App' }
  ])

  const categories = [
    { id: 'all', name: 'All Records', count: 24, color: 'bg-gray-500' },
    { id: 'prescriptions', name: 'Prescriptions', count: 8, color: 'bg-blue-500' },
    { id: 'lab-reports', name: 'Lab Reports', count: 6, color: 'bg-green-500' },
    { id: 'medical-history', name: 'Medical History', count: 4, color: 'bg-purple-500' },
    { id: 'vaccination', name: 'Vaccination', count: 3, color: 'bg-yellow-500' },
    { id: 'insurance', name: 'Insurance', count: 3, color: 'bg-red-500' },
    { id: 'imaging', name: 'Imaging', count: 5, color: 'bg-indigo-500' },
    { id: 'billing', name: 'Billing', count: 4, color: 'bg-pink-500' }
  ]

  const records = [
    {
      id: 1,
      title: 'Complete Blood Count',
      category: 'lab-reports',
      date: '2024-01-15',
      doctor: 'Dr. Sarah Johnson',
      hospital: 'Apollo Hospital',
      size: '2.4 MB',
      type: 'PDF',
      encrypted: true,
      priority: 'normal',
      sharedWith: ['Dr. Michael Chen'],
      content: 'Hemoglobin: 14.5 g/dL\nWhite Blood Cells: 7,500/μL\nPlatelets: 250,000/μL\nAll values within normal range.',
      tags: ['urgent', 'lab', 'blood'],
      lastAccessed: '2024-01-15 10:30 AM'
    },
    {
      id: 2,
      title: 'ECG Analysis Report',
      category: 'lab-reports',
      date: '2024-01-10',
      doctor: 'Dr. Robert Kim',
      hospital: 'Fortis Hospital',
      size: '1.8 MB',
      type: 'PDF',
      encrypted: true,
      priority: 'high',
      sharedWith: [],
      content: 'ECG Analysis: Normal sinus rhythm. Heart rate: 72 bpm. No abnormalities detected.',
      tags: ['cardiology', 'heart'],
      lastAccessed: '2024-01-10 02:15 PM'
    },
    {
      id: 3,
      title: 'Diabetes Management Plan',
      category: 'prescriptions',
      date: '2024-01-08',
      doctor: 'Dr. Priya Sharma',
      hospital: 'Kokilaben Hospital',
      size: '0.5 MB',
      type: 'PDF',
      encrypted: true,
      priority: 'normal',
      sharedWith: ['Dr. Sarah Johnson'],
      content: 'Medication: Metformin 500mg\nDosage: Twice daily after meals\nDuration: 3 months\nFollow-up: 3 weeks',
      tags: ['chronic', 'prescription'],
      lastAccessed: '2024-01-08 09:20 AM'
    },
    {
      id: 4,
      title: 'Chest X-Ray DICOM',
      category: 'imaging',
      date: '2024-01-05',
      doctor: 'Dr. James Wilson',
      hospital: 'Lilavati Hospital',
      size: '5.2 MB',
      type: 'DICOM',
      encrypted: true,
      priority: 'normal',
      sharedWith: [],
      content: 'Chest X-Ray: Clear lung fields. No evidence of pneumonia or consolidation. Heart size normal.',
      tags: ['imaging', 'xray'],
      lastAccessed: '2024-01-05 11:45 AM'
    },
    {
      id: 5,
      title: 'Medical History Comprehensive',
      category: 'medical-history',
      date: '2024-01-01',
      doctor: 'Dr. Sarah Johnson',
      hospital: 'Apollo Hospital',
      size: '1.2 MB',
      type: 'PDF',
      encrypted: true,
      priority: 'high',
      sharedWith: ['Dr. Michael Chen', 'Dr. Priya Sharma'],
      content: 'Patient history includes hypertension (controlled), Type 2 diabetes (managed with medication). No known allergies.',
      tags: ['history', 'chronic'],
      lastAccessed: '2024-01-01 08:30 AM'
    },
    {
      id: 6,
      title: 'COVID-19 Vaccination Certificate',
      category: 'vaccination',
      date: '2023-12-20',
      doctor: 'Community Health Center',
      hospital: 'Government Hospital',
      size: '0.8 MB',
      type: 'PDF',
      encrypted: true,
      priority: 'normal',
      sharedWith: [],
      content: 'Vaccine: Covishield (2nd dose)\nBatch No: ABC123456\nAdministration Date: Dec 20, 2023\nVerified: Government Portal',
      tags: ['vaccine', 'certificate'],
      lastAccessed: '2023-12-20 03:15 PM'
    }
  ]

  const doctors = [
    { id: 1, name: 'Dr. Sarah Johnson', specialty: 'Cardiology', verified: true, avatarColor: 'bg-blue-500' },
    { id: 2, name: 'Dr. Michael Chen', specialty: 'Neurology', verified: true, avatarColor: 'bg-green-500' },
    { id: 3, name: 'Dr. Priya Sharma', specialty: 'Pediatrics', verified: true, avatarColor: 'bg-purple-500' },
    { id: 4, name: 'Dr. James Wilson', specialty: 'Orthopedics', verified: true, avatarColor: 'bg-orange-500' }
  ]

  const securityFeatures = [
    {
      icon: Lock,
      title: 'AES-256 Encryption',
      description: 'Military-grade encryption for all stored data',
      status: 'active',
      color: 'text-green-600'
    },
    {
      icon: ShieldCheck,
      title: 'Zero-Knowledge Proof',
      description: 'We cannot access your encrypted data',
      status: 'active',
      color: 'text-blue-600'
    },
    {
      icon: BarChart,
      title: 'Blockchain Audit Trail',
      description: 'Tamper-proof record verification',
      status: 'active',
      color: 'text-purple-600'
    },
    {
      icon: AlertCircle,
      title: 'Real-time Alerts',
      description: 'Get notified when records are accessed',
      status: 'active',
      color: 'text-orange-600'
    },
    {
      icon: Key,
      title: 'End-to-End Encryption',
      description: 'Data encrypted in transit and at rest',
      status: 'active',
      color: 'text-red-600'
    },
    {
      icon: QrCode,
      title: 'QR Code Access',
      description: 'Secure one-time access codes',
      status: 'enabled',
      color: 'text-indigo-600'
    }
  ]

  // Filtered and sorted records
  const filteredRecords = useMemo(() => {
    let filtered = records

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(record => record.category === selectedCategory)
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(record => 
        record.title.toLowerCase().includes(query) ||
        record.doctor.toLowerCase().includes(query) ||
        record.hospital.toLowerCase().includes(query) ||
        record.tags.some(tag => tag.toLowerCase().includes(query))
      )
    }

    // Filter by date range
    if (dateRange.start) {
      filtered = filtered.filter(record => record.date >= dateRange.start)
    }
    if (dateRange.end) {
      filtered = filtered.filter(record => record.date <= dateRange.end)
    }

    // Sort records
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          return new Date(b.date) - new Date(a.date)
        case 'date-asc':
          return new Date(a.date) - new Date(b.date)
        case 'title-asc':
          return a.title.localeCompare(b.title)
        case 'title-desc':
          return b.title.localeCompare(a.title)
        case 'size-desc':
          return parseFloat(b.size) - parseFloat(a.size)
        case 'size-asc':
          return parseFloat(a.size) - parseFloat(b.size)
        default:
          return 0
      }
    })

    return filtered
  }, [selectedCategory, searchQuery, dateRange, sortBy])

  // Calculate storage usage
  const storageUsage = useMemo(() => {
    const totalSize = records.reduce((sum, record) => {
      const size = parseFloat(record.size)
      return sum + (isNaN(size) ? 0 : size)
    }, 0)
    const totalMB = totalSize.toFixed(1)
    const usagePercentage = (totalMB / 1024) * 100
    return { totalMB, usagePercentage }
  }, [records])

  // File upload handlers
  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files)
    setUploadedFiles(prev => [...prev, ...selectedFiles])
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    
    const droppedFiles = Array.from(e.dataTransfer.files)
    const validFiles = droppedFiles.filter(file => {
      const validTypes = [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'image/jpg',
        'application/dicom'
      ]
      const validExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.dcm']
      
      return validTypes.includes(file.type) ||
             validExtensions.some(ext => file.name.toLowerCase().endsWith(ext))
    })
    
    setUploadedFiles(prev => [...prev, ...validFiles])
  }

  const handleBrowseClick = () => {
    fileInputRef.current.click()
  }

  const removeFile = (index) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleUploadSubmit = () => {
    if (uploadedFiles.length === 0) {
      alert('Please select at least one file to upload')
      return
    }

    if (!uploadForm.recordType || !uploadForm.recordDate || !uploadForm.doctorName || !uploadForm.hospitalName) {
      alert('Please fill in all required fields')
      return
    }

    // Simulate upload process
    const totalSize = uploadedFiles.reduce((sum, file) => sum + file.size, 0)
    const sizeInMB = (totalSize / (1024 * 1024)).toFixed(2)
    
    // Add new record
    const newRecord = {
      id: records.length + 1,
      title: uploadedFiles.map(f => f.name).join(', '),
      category: uploadForm.recordType.toLowerCase().replace(/\s+/g, '-'),
      date: uploadForm.recordDate,
      doctor: uploadForm.doctorName,
      hospital: uploadForm.hospitalName,
      size: `${sizeInMB} MB`,
      type: uploadedFiles.map(f => {
        const ext = f.name.split('.').pop().toUpperCase()
        return ext === 'PDF' ? 'PDF' : ext === 'DCM' ? 'DICOM' : 'IMAGE'
      }).join(', '),
      encrypted: true,
      priority: 'normal',
      sharedWith: [],
      content: uploadForm.notes || 'No additional notes provided.',
      tags: ['uploaded', 'new'],
      lastAccessed: new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit' 
      }) + ' ' + new Date().toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    }

    // In a real app, you would send the files to your server here
    alert(`Successfully uploaded ${uploadedFiles.length} file(s)! The files are now being encrypted and stored securely.`)
    
    // Reset form
    setUploadedFiles([])
    setUploadForm({
      recordType: '',
      recordDate: '',
      doctorName: '',
      hospitalName: '',
      notes: ''
    })
    setUploadModal(false)
  }

  const handleShare = (recordId) => {
    const record = records.find(r => r.id === recordId)
    setSelectedRecord(record)
    setSelectedDoctors(record.sharedWith || [])
    setShareModal(true)
  }

  const handleShareSubmit = () => {
    const updatedAccessLog = {
      id: accessLogs.length + 1,
      doctor: selectedDoctors[selectedDoctors.length - 1] || 'Multiple Doctors',
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      action: 'Shared',
      ip: 'Local System',
      location: 'Patient Portal'
    }
    setAccessLogs([updatedAccessLog, ...accessLogs])
    setShareModal(false)
  }

  const handleDownload = (recordId) => {
    const record = records.find(r => r.id === recordId)
    const blob = new Blob([`Medical Record: ${record.title}\n\nDate: ${record.date}\nDoctor: ${record.doctor}\nHospital: ${record.hospital}\n\n${record.content}`], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${record.title.replace(/\s+/g, '_')}_${record.date}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    const downloadLog = {
      id: accessLogs.length + 1,
      doctor: 'You',
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      action: 'Downloaded',
      ip: 'Local System',
      location: 'Browser Download'
    }
    setAccessLogs([downloadLog, ...accessLogs])
  }

  const handleBulkDownload = () => {
    if (selectedRecords.size === 0) return
    
    const selectedRecordsData = records.filter(r => selectedRecords.has(r.id))
    const content = selectedRecordsData.map(record => 
      `=== ${record.title} ===\nDate: ${record.date}\nDoctor: ${record.doctor}\nHospital: ${record.hospital}\n${record.content}\n\n`
    ).join('\n')
    
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `medical_records_${new Date().toISOString().split('T')[0]}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    setSelectedRecords(new Set())
  }

  const handleView = (recordId) => {
    const record = records.find(r => r.id === recordId)
    setSelectedRecord(record)
    setViewModal(true)

    const viewLog = {
      id: accessLogs.length + 1,
      doctor: 'You',
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      action: 'Viewed',
      ip: 'Local System',
      location: 'Document Viewer'
    }
    setAccessLogs([viewLog, ...accessLogs])
  }

  const toggleDoctorSelection = (doctorName) => {
    setSelectedDoctors(prev => 
      prev.includes(doctorName)
        ? prev.filter(d => d !== doctorName)
        : [...prev, doctorName]
    )
  }

  const clearFilters = () => {
    setSearchQuery('')
    setDateRange({ start: '', end: '' })
    setSortBy('date-desc')
    setSelectedCategory('all')
    setSelectedRecords(new Set())
  }

  const handleRefresh = () => {
    setIsRefreshing(true)
    setTimeout(() => {
      setIsRefreshing(false)
    }, 1000)
  }

  const toggleRecordSelection = (recordId) => {
    const newSelected = new Set(selectedRecords)
    if (newSelected.has(recordId)) {
      newSelected.delete(recordId)
    } else {
      newSelected.add(recordId)
    }
    setSelectedRecords(newSelected)
  }

  const selectAllRecords = () => {
    if (selectedRecords.size === filteredRecords.length) {
      setSelectedRecords(new Set())
    } else {
      setSelectedRecords(new Set(filteredRecords.map(r => r.id)))
    }
  }

  const getCategoryColor = (categoryId) => {
    const category = categories.find(c => c.id === categoryId)
    return category ? category.color : 'bg-gray-500'
  }

  const getPriorityBadge = (priority) => {
    const styles = {
      high: 'bg-red-100 text-red-700',
      normal: 'bg-green-100 text-green-700',
      low: 'bg-yellow-100 text-yellow-700'
    }
    return styles[priority] || styles.normal
  }

  const handleFormChange = (field, value) => {
    setUploadForm(prev => ({
      ...prev,
      [field]: value
    }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-slate-100 py-4 md:py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Back Button */}
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <button 
            onClick={() => window.history.back()}
            className="group inline-flex items-center text-gray-600 hover:text-gray-900 bg-white px-4 py-2.5 rounded-lg shadow hover:shadow-md transition-all"
          >
            <ChevronLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-medium">Back to Services</span>
          </button>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
            {selectedRecords.size > 0 && (
              <button
                onClick={handleBulkDownload}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                <Download className="w-4 h-4" />
                Download ({selectedRecords.size})
              </button>
            )}
          </div>
        </div>

        {/* Header */}
        <div className="bg-gradient-to-r from-gray-800 to-slate-900 rounded-2xl shadow-2xl p-6 md:p-8 mb-6 md:mb-8 text-white">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 mb-8">
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-r from-blue-500 to-cyan-400 p-3.5 rounded-xl shadow-lg">
                <Shield className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold mb-1">Secure Medical Vault</h1>
                <p className="text-gray-300 text-sm md:text-base">Military-grade encrypted storage for your health records</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => setUploadModal(true)}
                className="group flex items-center gap-2 bg-white text-gray-900 px-5 py-3 rounded-xl hover:bg-gray-100 hover:shadow-lg transition-all font-medium"
              >
                <Upload className="w-5 h-5 group-hover:translate-y-[-2px] transition-transform" />
                Upload Records
              </button>
              <button className="p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-colors">
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-300">Total Records</div>
                  <div className="text-2xl font-bold">{records.length}</div>
                </div>
                <Database className="w-8 h-8 text-blue-400" />
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-300">Storage Used</div>
                  <div className="text-2xl font-bold">{storageUsage.totalMB} MB</div>
                </div>
                <BarChart className="w-8 h-8 text-green-400" />
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-300">Shared With</div>
                  <div className="text-2xl font-bold">{doctors.length}</div>
                </div>
                <Users className="w-8 h-8 text-purple-400" />
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-300">Security Score</div>
                  <div className="text-2xl font-bold">98%</div>
                </div>
                <ShieldCheck className="w-8 h-8 text-orange-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setActiveTab('records')}
            className={`px-4 py-3 rounded-lg font-medium transition-all ${activeTab === 'records' ? 'bg-white shadow-lg text-gray-900' : 'text-gray-600 hover:bg-white/50'}`}
          >
            <FileText className="w-4 h-4 inline mr-2" />
            Records
          </button>
          <button
            onClick={() => setActiveTab('access')}
            className={`px-4 py-3 rounded-lg font-medium transition-all ${activeTab === 'access' ? 'bg-white shadow-lg text-gray-900' : 'text-gray-600 hover:bg-white/50'}`}
          >
            <Eye className="w-4 h-4 inline mr-2" />
            Access Logs
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`px-4 py-3 rounded-lg font-medium transition-all ${activeTab === 'security' ? 'bg-white shadow-lg text-gray-900' : 'text-gray-600 hover:bg-white/50'}`}
          >
            <Shield className="w-4 h-4 inline mr-2" />
            Security
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 md:gap-8">
          {/* Main Content */}
          <div className="flex-1">
            {/* Search and Filter Bar */}
            <div className="bg-white rounded-2xl shadow-lg p-4 md:p-6 mb-6">
              <div className="flex flex-col md:flex-row gap-4 mb-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search records, doctors, hospitals, or tags..."
                    className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent"
                  />
                </div>
                
                <div className="flex gap-3">
                  <button 
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center gap-2 border border-gray-200 px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    <Filter className="w-5 h-5" />
                    Filters
                    <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {selectedRecords.size > 0 && (
                    <button
                      onClick={selectAllRecords}
                      className="px-4 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                      {selectedRecords.size === filteredRecords.length ? 'Deselect All' : 'Select All'}
                    </button>
                  )}
                </div>
              </div>

              {/* Advanced Filters */}
              {showFilters && (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
                  <div className="grid md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Date Range
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="date"
                          value={dateRange.start}
                          onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                        />
                        <span className="self-center text-gray-400">to</span>
                        <input
                          type="date"
                          value={dateRange.end}
                          onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Sort By
                      </label>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                      >
                        <option value="date-desc">Newest First</option>
                        <option value="date-asc">Oldest First</option>
                        <option value="title-asc">Title A-Z</option>
                        <option value="title-desc">Title Z-A</option>
                        <option value="size-desc">Largest First</option>
                        <option value="size-asc">Smallest First</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Record Type
                      </label>
                      <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                      >
                        {categories.map(category => (
                          <option key={category.id} value={category.id}>{category.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <button
                      onClick={clearFilters}
                      className="text-sm text-gray-600 hover:text-gray-800 font-medium"
                    >
                      Clear All Filters
                    </button>
                    <span className="text-sm text-gray-500">
                      {filteredRecords.length} records found
                    </span>
                  </div>
                </div>
              )}

              {/* Categories */}
              <div className="mt-6">
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`group relative px-4 py-2.5 rounded-xl font-medium transition-all flex items-center gap-2 ${
                        selectedCategory === category.id
                          ? `${category.color} text-white shadow-lg`
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <div className={`w-2 h-2 rounded-full ${category.color}`}></div>
                      {category.name}
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        selectedCategory === category.id
                          ? 'bg-white/20'
                          : 'bg-gray-200 text-gray-600'
                      }`}>
                        {category.count}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Records Grid */}
            {activeTab === 'records' && (
              <div className="space-y-4">
                {filteredRecords.length === 0 ? (
                  <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                    <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-800 mb-2">No Records Found</h3>
                    <p className="text-gray-600 mb-6">Try adjusting your filters or upload new records</p>
                    <button
                      onClick={() => setUploadModal(true)}
                      className="inline-flex items-center gap-2 bg-gray-800 text-white px-6 py-3 rounded-lg hover:bg-gray-900"
                    >
                      <Upload className="w-5 h-5" />
                      Upload Your First Record
                    </button>
                  </div>
                ) : (
                  filteredRecords.map((record) => (
                    <div
                      key={record.id}
                      className={`bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border ${
                        selectedRecords.has(record.id) ? 'border-blue-500 ring-2 ring-blue-100' : 'border-gray-100'
                      }`}
                    >
                      <div className="p-5">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-start gap-4 flex-1">
                            <label className="mt-1">
                              <input
                                type="checkbox"
                                checked={selectedRecords.has(record.id)}
                                onChange={() => toggleRecordSelection(record.id)}
                                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                              />
                            </label>
                            
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <div className={`${getCategoryColor(record.category)} w-3 h-3 rounded-full`}></div>
                                <h3 className="font-bold text-lg text-gray-900">{record.title}</h3>
                                {record.encrypted && (
                                  <Lock className="w-4 h-4 text-green-600 flex-shrink-0" />
                                )}
                                <span className={`text-xs px-2 py-1 rounded-full ${getPriorityBadge(record.priority)}`}>
                                  {record.priority}
                                </span>
                              </div>
                              
                              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 mb-3">
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-4 h-4" />
                                  {record.date}
                                </span>
                                <span className="flex items-center gap-1">
                                  <User className="w-4 h-4" />
                                  {record.doctor}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Hospital className="w-4 h-4" />
                                  {record.hospital}
                                </span>
                              </div>
                              
                              <div className="flex flex-wrap gap-2 mb-3">
                                {record.tags.map((tag, index) => (
                                  <span key={index} className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                                    #{tag}
                                  </span>
                                ))}
                              </div>
                              
                              <div className="text-sm text-gray-500">
                                Last accessed: {record.lastAccessed}
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <div className="text-sm font-medium text-gray-700">{record.size}</div>
                            <div className="text-xs text-gray-500">{record.type}</div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                          <div className="text-sm">
                            {record.sharedWith.length > 0 ? (
                              <div className="flex items-center gap-2">
                                <Users className="w-4 h-4 text-gray-400" />
                                <span className="text-gray-600">
                                  Shared with {record.sharedWith.length} doctor{record.sharedWith.length !== 1 ? 's' : ''}
                                </span>
                              </div>
                            ) : (
                              <span className="text-gray-400">Not shared</span>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleView(record.id)}
                              className="group p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                              title="View"
                            >
                              <Eye className="w-5 h-5 group-hover:scale-110 transition-transform" />
                            </button>
                            <button
                              onClick={() => handleDownload(record.id)}
                              className="group p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                              title="Download"
                            >
                              <Download className="w-5 h-5 group-hover:scale-110 transition-transform" />
                            </button>
                            <button
                              onClick={() => handleShare(record.id)}
                              className="group p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                              title="Share"
                            >
                              <Share2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedRecord(record)
                                setDeleteModal(true)
                              }}
                              className="group p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Access Logs Tab */}
            {activeTab === 'access' && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-800">Access History</h3>
                  <button className="text-sm text-gray-600 hover:text-gray-800">
                    Export Logs
                  </button>
                </div>
                
                <div className="space-y-4">
                  {accessLogs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center">
                          <User className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{log.doctor}</h4>
                          <div className="flex items-center gap-3 text-sm text-gray-600 mt-1">
                            <span>{log.date}</span>
                            <span className="flex items-center">
                              <Clock className="w-4 h-4 mr-1" />
                              {log.time}
                            </span>
                            <span className="text-xs px-2 py-1 bg-gray-100 rounded">
                              {log.location}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <span className={`inline-block text-sm font-medium px-3 py-1 rounded-full ${
                          log.action === 'Viewed'
                            ? 'bg-blue-100 text-blue-700'
                            : log.action === 'Downloaded'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-purple-100 text-purple-700'
                        }`}>
                          {log.action}
                        </span>
                        <div className="text-xs text-gray-500 mt-1">
                          IP: {log.ip}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Security Dashboard</h3>
                    <p className="text-gray-600">Monitor and manage your security settings</p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-green-600">98%</div>
                    <div className="text-sm text-gray-500">Security Score</div>
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {securityFeatures.map((feature, index) => (
                    <div key={index} className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-xl p-5">
                      <div className="flex items-start gap-3 mb-3">
                        <feature.icon className={`w-6 h-6 ${feature.color}`} />
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-900">{feature.title}</h4>
                          <p className="text-sm text-gray-600 mt-1">{feature.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium px-2 py-1 bg-green-100 text-green-700 rounded">
                          {feature.status}
                        </span>
                        <button className="text-xs text-gray-500 hover:text-gray-700">
                          Configure
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:w-96 space-y-6">
            {/* Storage Usage */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900">Storage Usage</h3>
                <Database className="w-5 h-5 text-gray-400" />
              </div>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Used: {storageUsage.totalMB} MB</span>
                    <span className="font-medium">{storageUsage.usagePercentage.toFixed(2)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-cyan-400 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(storageUsage.usagePercentage, 100)}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    1 GB total storage
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Documents</span>
                    <span className="font-medium">9.1 MB</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Images</span>
                    <span className="font-medium">2.8 MB</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Encrypted Files</span>
                    <span className="font-medium">{records.length}</span>
                  </div>
                  <div className="pt-3 border-t">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-900 font-medium">Available</span>
                      <span className="text-green-600 font-bold">{(1024 - parseFloat(storageUsage.totalMB)).toFixed(1)} MB</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-gradient-to-r from-gray-800 to-slate-900 rounded-2xl shadow-lg p-6 text-white">
              <h3 className="text-lg font-bold mb-6">Quick Actions</h3>
              
              <div className="space-y-3">
                <button
                  onClick={() => setUploadModal(true)}
                  className="w-full flex items-center gap-3 bg-white/10 hover:bg-white/20 p-3 rounded-xl transition-colors"
                >
                  <Upload className="w-5 h-5" />
                  <span>Upload New Records</span>
                </button>
                <button
                  onClick={handleBulkDownload}
                  className="w-full flex items-center gap-3 bg-white/10 hover:bg-white/20 p-3 rounded-xl transition-colors"
                >
                  <Download className="w-5 h-5" />
                  <span>Download Selected</span>
                </button>
                <button className="w-full flex items-center gap-3 bg-white/10 hover:bg-white/20 p-3 rounded-xl transition-colors">
                  <Share2 className="w-5 h-5" />
                  <span>Share Multiple Records</span>
                </button>
                <button className="w-full flex items-center gap-3 bg-white/10 hover:bg-white/20 p-3 rounded-xl transition-colors">
                  <QrCode className="w-5 h-5" />
                  <span>Generate Access Code</span>
                </button>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-6">Recent Activity</h3>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Download className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">Blood Test Downloaded</div>
                    <div className="text-xs text-gray-500">2 minutes ago</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <Share2 className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">Shared with Dr. Johnson</div>
                    <div className="text-xs text-gray-500">1 hour ago</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <FileUp className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">ECG Report Uploaded</div>
                    <div className="text-xs text-gray-500">Yesterday</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* View Modal */}
        {viewModal && selectedRecord && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{selectedRecord.title}</h3>
                  <div className="flex items-center gap-3 text-sm text-gray-600 mt-1">
                    <span>{selectedRecord.date}</span>
                    <span>•</span>
                    <span>{selectedRecord.doctor}</span>
                    <span>•</span>
                    <span>{selectedRecord.hospital}</span>
                  </div>
                </div>
                <button
                  onClick={() => setViewModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                <div className="prose max-w-none">
                  <div className="bg-gray-50 rounded-xl p-6 mb-6">
                    <h4 className="font-bold text-lg text-gray-900 mb-4">Record Summary</h4>
                    <pre className="whitespace-pre-wrap font-sans text-gray-700">{selectedRecord.content}</pre>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <div className="text-sm text-gray-500">Record Type</div>
                        <div className="font-medium">{selectedRecord.type}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">File Size</div>
                        <div className="font-medium">{selectedRecord.size}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Encryption Status</div>
                        <div className="flex items-center gap-2">
                          <Lock className="w-4 h-4 text-green-600" />
                          <span className="font-medium text-green-700">AES-256 Encrypted</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <div className="text-sm text-gray-500">Shared With</div>
                        <div className="space-y-2">
                          {selectedRecord.sharedWith.length > 0 ? (
                            selectedRecord.sharedWith.map((doctor, index) => (
                              <div key={index} className="flex items-center gap-2">
                                <User className="w-4 h-4 text-gray-400" />
                                <span className="font-medium">{doctor}</span>
                              </div>
                            ))
                          ) : (
                            <div className="text-gray-400">Not shared with any doctors</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-6 border-t border-gray-200">
                <button
                  onClick={() => setViewModal(false)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Close
                </button>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleDownload(selectedRecord.id)}
                    className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
                  >
                    <Download className="w-5 h-5" />
                    Download
                  </button>
                  <button
                    onClick={() => {
                      setViewModal(false)
                      handleShare(selectedRecord.id)
                    }}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <Share2 className="w-5 h-5" />
                    Share
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Share Modal */}
        {shareModal && selectedRecord && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-md w-full">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Share Record</h3>
                  <p className="text-sm text-gray-600 mt-1">{selectedRecord.title}</p>
                </div>
                <button
                  onClick={() => setShareModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6">
                <div className="space-y-4">
                  {doctors.map((doctor) => (
                    <label key={doctor.id} className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer">
                      <input 
                        type="checkbox"
                        checked={selectedDoctors.includes(doctor.name)}
                        onChange={() => toggleDoctorSelection(doctor.name)}
                        className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <div className={`w-10 h-10 ${doctor.avatarColor} rounded-full flex items-center justify-center text-white font-bold`}>
                        {doctor.name.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{doctor.name}</div>
                        <div className="text-sm text-gray-600">{doctor.specialty}</div>
                      </div>
                      {doctor.verified && (
                        <ShieldCheck className="w-5 h-5 text-green-500" />
                      )}
                    </label>
                  ))}
                </div>
                
                <div className="mt-8">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Add Custom Email
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      placeholder="doctor@hospital.com"
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                    />
                    <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                      Add
                    </button>
                  </div>
                </div>
                
                <div className="mt-8 flex gap-3">
                  <button
                    onClick={() => setShareModal(false)}
                    className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleShareSubmit}
                    className="flex-1 px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
                  >
                    Share with {selectedDoctors.length} Doctor{selectedDoctors.length !== 1 ? 's' : ''}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Upload Modal */}
        {uploadModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-2xl w-full">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-xl font-bold text-gray-900">Upload Medical Records</h3>
                <button
                  onClick={() => setUploadModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6">
                {/* File Upload Area */}
                <div 
                  className={`border-2 border-dashed ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'} rounded-2xl p-8 text-center transition-colors cursor-pointer`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={handleBrowseClick}
                >
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <div className="font-medium text-gray-900 mb-2">
                    {uploadedFiles.length > 0 
                      ? `${uploadedFiles.length} file${uploadedFiles.length !== 1 ? 's' : ''} selected` 
                      : 'Click to select files or drag and drop'}
                  </div>
                  <div className="text-sm text-gray-600 mb-6">
                    Supports PDF, JPG, PNG, DICOM (Max 100MB each)
                  </div>
                  <div className="inline-flex items-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-lg hover:bg-gray-800">
                    <FileUp className="w-5 h-5" />
                    Browse Files
                  </div>
                  <input 
                    ref={fileInputRef}
                    type="file" 
                    multiple
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png,.dcm"
                    onChange={handleFileSelect}
                  />
                </div>

                {/* Selected Files List */}
                {uploadedFiles.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-medium text-gray-900 mb-3">Selected Files:</h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {uploadedFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <FileText className="w-5 h-5 text-gray-400" />
                            <div>
                              <div className="text-sm font-medium text-gray-900 truncate max-w-xs">
                                {file.name}
                              </div>
                              <div className="text-xs text-gray-500">
                                {(file.size / (1024 * 1024)).toFixed(2)} MB
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              removeFile(index)
                            }}
                            className="p-1 text-gray-400 hover:text-red-500"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Form Fields */}
                <div className="grid md:grid-cols-2 gap-4 mt-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Record Type *
                    </label>
                    <select 
                      value={uploadForm.recordType}
                      onChange={(e) => handleFormChange('recordType', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                    >
                      <option value="">Select type</option>
                      {categories.slice(1).map(category => (
                        <option key={category.id} value={category.name}>{category.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date of Record *
                    </label>
                    <input
                      type="date"
                      value={uploadForm.recordDate}
                      onChange={(e) => handleFormChange('recordDate', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Doctor Name *
                    </label>
                    <input
                      type="text"
                      value={uploadForm.doctorName}
                      onChange={(e) => handleFormChange('doctorName', e.target.value)}
                      placeholder="Enter doctor name"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Hospital/Clinic *
                    </label>
                    <input
                      type="text"
                      value={uploadForm.hospitalName}
                      onChange={(e) => handleFormChange('hospitalName', e.target.value)}
                      placeholder="Enter hospital name"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                    />
                  </div>
                </div>
                
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes (Optional)
                  </label>
                  <textarea
                    rows="3"
                    value={uploadForm.notes}
                    onChange={(e) => handleFormChange('notes', e.target.value)}
                    placeholder="Add any notes about this record..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                  />
                </div>
                
                <div className="mt-8 flex gap-3">
                  <button
                    onClick={() => {
                      setUploadModal(false)
                      setUploadedFiles([])
                      setUploadForm({
                        recordType: '',
                        recordDate: '',
                        doctorName: '',
                        hospitalName: '',
                        notes: ''
                      })
                    }}
                    className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUploadSubmit}
                    className="flex-1 px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
                  >
                    Upload & Encrypt
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Modal */}
        {deleteModal && selectedRecord && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-md w-full">
              <div className="p-6">
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
                
                <h3 className="text-xl font-bold text-center text-gray-900 mb-2">
                  Delete Record?
                </h3>
                
                <p className="text-gray-600 text-center mb-6">
                  Are you sure you want to delete "{selectedRecord.title}"? This action cannot be undone.
                </p>
                
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-red-700">
                      This will permanently delete the record and remove it from all shared connections.
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={() => setDeleteModal(false)}
                    className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      alert(`Record "${selectedRecord.title}" has been deleted.`)
                      setDeleteModal(false)
                    }}
                    className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    Delete Permanently
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default RecordsPage