import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Activity,
  ChevronLeft,
  Heart,
  Thermometer,
  Droplets,
  Battery,
  Clock,
  TrendingUp,
  Bell,
  Settings,
  Calendar,
  Download,
  Share2,
  Plus,
  AlertCircle,
  CheckCircle,
  Zap,
  LineChart,
  X,
  Loader
} from 'lucide-react'
import { 
  healthMetricsService, 
  deviceService, 
  medicationService, 
  reminderService, 
  healthAlertService, 
  healthGoalService 
} from '../context/healthMonitoringService'

const MonitoringPage = () => {
  const [selectedMetric, setSelectedMetric] = useState('heart')
  const [devices, setDevices] = useState([])
  const [medications, setMedications] = useState([])
  const [reminders, setReminders] = useState([])
  const [vitals, setVitals] = useState({})
  const [trends, setTrends] = useState({ labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], heartRate: [], bloodPressure: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Modal states
  const [showAddDevice, setShowAddDevice] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showWeeklyReport, setShowWeeklyReport] = useState(false)
  const [showAlerts, setShowAlerts] = useState(false)
  const [showGoals, setShowGoals] = useState(false)
  const [showAddReminder, setShowAddReminder] = useState(false)

  // Form states
  const [deviceForm, setDeviceForm] = useState({ name: '', type: 'wearable', manufacturer: '' })
  const [reminderForm, setReminderForm] = useState({ time: '', action: '', reminderType: 'custom', priority: 'medium' })
  const [alerts, setAlerts] = useState([])
  const [goals, setGoals] = useState([])

  
  // Fetch data on mount
  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Fetch all data in parallel
      const [metricsRes, devicesRes, medicationsRes, remindersRes, alertsRes, goalsRes] = await Promise.allSettled([
        healthMetricsService.getLatestMetrics(),
        deviceService.getDevices(),
        medicationService.getMedications(),
        reminderService.getReminders(),
        healthAlertService.getAlerts(),
        healthGoalService.getGoals()
      ])

      // Handle metrics
      if (metricsRes.status === 'fulfilled' && metricsRes.value.data.success) {
        const metricsData = metricsRes.value.data.data
        setVitals(formatVitals(metricsData))
      } else {
        setVitals(getDefaultVitals())
      }

      // Handle devices
      if (devicesRes.status === 'fulfilled' && devicesRes.value.data.success) {
        setDevices(devicesRes.value.data.data)
      } else {
        setDevices([])
      }

      // Handle medications
      if (medicationsRes.status === 'fulfilled' && medicationsRes.value.data.success) {
        setMedications(medicationsRes.value.data.data)
      } else {
        setMedications([])
      }

      // Handle reminders
      if (remindersRes.status === 'fulfilled' && remindersRes.value.data.success) {
        setReminders(remindersRes.value.data.data)
      } else {
        setReminders([])
      }

      // Handle alerts
      if (alertsRes.status === 'fulfilled' && alertsRes.value.data.success) {
        setAlerts(alertsRes.value.data.data)
      } else {
        setAlerts([])
      }

      // Handle goals
      if (goalsRes.status === 'fulfilled' && goalsRes.value.data.success) {
        setGoals(goalsRes.value.data.data)
      } else {
        setGoals([])
      }

      // Fetch trends
      await fetchTrends()
    } catch (err) {
      console.error('Error fetching data:', err)
      setError('Failed to load health data')
      setVitals(getDefaultVitals())
    } finally {
      setLoading(false)
    }
  }

  const fetchTrends = async () => {
    try {
      const heartRes = await healthMetricsService.getMetricsTrend('heart_rate', 7)
      const bpRes = await healthMetricsService.getMetricsTrend('blood_pressure', 7)
      
      if (heartRes.data.success && bpRes.data.success) {
        const heartTrend = heartRes.data.data.map(m => m.value || 0)
        const bpTrend = bpRes.data.data.map(m => m.systolic || 0)
        setTrends({
          labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          heartRate: heartTrend.length > 0 ? heartTrend : [72, 75, 70, 68, 74, 72, 71],
          bloodPressure: bpTrend.length > 0 ? bpTrend : [120, 118, 122, 119, 121, 120, 118]
        })
      }
    } catch (err) {
      console.error('Error fetching trends:', err)
    }
  }

  const formatVitals = (metricsData) => {
    return {
      heart: metricsData.heart_rate || getDefaultVitals().heart,
      bp: metricsData.blood_pressure || getDefaultVitals().bp,
      temp: metricsData.temperature || getDefaultVitals().temp,
      oxygen: metricsData.blood_oxygen || getDefaultVitals().oxygen
    }
  }

  const getDefaultVitals = () => ({
    heart: {
      value: 72,
      unit: 'bpm',
      label: 'Heart Rate',
      icon: <Heart className="w-6 h-6" />,
      status: 'normal',
      range: '60-100',
      trend: 'stable'
    },
    bp: {
      systolic: 120,
      diastolic: 80,
      unit: 'mmHg',
      label: 'Blood Pressure',
      icon: <Activity className="w-6 h-6" />,
      status: 'normal',
      range: '120/80',
      trend: 'stable'
    },
    temp: {
      value: 98.6,
      unit: '°F',
      label: 'Body Temperature',
      icon: <Thermometer className="w-6 h-6" />,
      status: 'normal',
      range: '97-99',
      trend: 'stable'
    },
    oxygen: {
      value: 98,
      unit: '%',
      label: 'Blood Oxygen',
      icon: <Droplets className="w-6 h-6" />,
      status: 'good',
      range: '95-100',
      trend: 'stable'
    }
  })

  // ==================== EVENT HANDLERS ====================

  const toggleReminder = async (reminderId) => {
    try {
      await reminderService.toggleReminder(reminderId)
      setReminders(prev => prev.map(r => r._id === reminderId ? { ...r, active: !r.active } : r))
    } catch (err) {
      console.error('Error toggling reminder:', err)
    }
  }

  const toggleMedication = async (medicationId) => {
    try {
      await medicationService.toggleMedicationTaken(medicationId)
      setMedications(prev => prev.map(m => m._id === medicationId ? { ...m, taken: !m.taken } : m))
    } catch (err) {
      console.error('Error toggling medication:', err)
    }
  }

  const handleAddDevice = async (e) => {
    e.preventDefault()
    try {
      const res = await deviceService.addDevice(deviceForm)
      if (res.data.success) {
        setDevices([...devices, res.data.data])
        setDeviceForm({ name: '', type: 'wearable', manufacturer: '' })
        setShowAddDevice(false)
      }
    } catch (err) {
      console.error('Error adding device:', err)
    }
  }

  const handleAddReminder = async (e) => {
    e.preventDefault()
    try {
      const res = await reminderService.addReminder(reminderForm)
      if (res.data.success) {
        setReminders([...reminders, res.data.data])
        setReminderForm({ time: '', action: '', reminderType: 'custom', priority: 'medium' })
        setShowAddReminder(false)
      }
    } catch (err) {
      console.error('Error adding reminder:', err)
    }
  }

  const handleDeleteDevice = async (deviceId) => {
    try {
      const res = await deviceService.deleteDevice(deviceId)
      if (res.data.success) {
        setDevices(devices.filter(d => d._id !== deviceId))
      }
    } catch (err) {
      console.error('Error deleting device:', err)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        <Link 
          to="/services"
          className="inline-flex items-center text-orange-600 hover:text-orange-700 mb-6 bg-white px-4 py-2 rounded-full shadow"
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back to Services
        </Link>

        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 mb-8">
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-r from-orange-500 to-yellow-600 p-3 rounded-xl text-white">
                <Activity className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-800">Health Monitoring</h1>
                <p className="text-gray-600">Track your vitals and health progress</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setShowAddDevice(true)}
                className="flex items-center gap-2 bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700">
                <Plus className="w-5 h-5" />
                Add Device
              </button>
              <button 
                onClick={() => setShowSettings(true)}
                className="flex items-center gap-2 border border-orange-600 text-orange-600 px-6 py-3 rounded-lg hover:bg-orange-50">
                <Settings className="w-5 h-5" />
                Settings
              </button>
            </div>
          </div>

          {/* Current Status */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {Object.entries(vitals).map(([key, metric]) => (
              <button
                key={key}
                onClick={() => setSelectedMetric(key)}
                className={`p-4 rounded-xl border-2 transition-all ${
                  selectedMetric === key
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-gray-200 hover:border-orange-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="text-orange-600">{metric.icon}</div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    metric.status === 'normal' || metric.status === 'good'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {metric.status}
                  </span>
                </div>
                <div className="text-2xl font-bold text-gray-800">
                  {key === 'bp' ? `${metric.systolic}/${metric.diastolic}` : metric.value}
                  <span className="text-sm text-gray-600 ml-1">{metric.unit}</span>
                </div>
                <div className="text-sm text-gray-600 mt-1">{metric.label}</div>
              </button>
            ))}
          </div>

          {/* Main Content */}
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left Column */}
            <div className="flex-1">
              {/* Detailed Metric View */}
              <div className="bg-white border rounded-2xl p-6 mb-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-800 flex items-center">
                    {vitals[selectedMetric].icon}
                    <span className="ml-3">{vitals[selectedMetric].label}</span>
                  </h3>
                  <div className="flex items-center gap-2">
                    <button className="p-2 hover:bg-gray-100 rounded-lg">
                      <Share2 className="w-5 h-5 text-gray-600" />
                    </button>
                    <button className="p-2 hover:bg-gray-100 rounded-lg">
                      <Download className="w-5 h-5 text-gray-600" />
                    </button>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <div className="text-6xl font-bold text-gray-800 mb-4">
                      {selectedMetric === 'bp' 
                        ? `${vitals[selectedMetric].systolic}/${vitals[selectedMetric].diastolic}`
                        : vitals[selectedMetric].value}
                      <span className="text-2xl text-gray-600 ml-2">{vitals[selectedMetric].unit}</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Current Status:</span>
                        <span className="font-medium capitalize">{vitals[selectedMetric].status}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Normal Range:</span>
                        <span className="font-medium">{vitals[selectedMetric].range}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Trend:</span>
                        <span className="font-medium flex items-center">
                          <TrendingUp className="w-4 h-4 mr-1" />
                          {vitals[selectedMetric].trend}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4">
                    <h4 className="font-medium text-gray-700 mb-3">Weekly Trend</h4>
                    <div className="h-32 flex items-end gap-1">
                      {trends[selectedMetric === 'heart' ? 'heartRate' : 'bloodPressure'].map((value, idx) => (
                        <div
                          key={idx}
                          className="flex-1 flex flex-col items-center"
                        >
                          <div
                            className={`w-full rounded-t ${
                              selectedMetric === 'heart'
                                ? 'bg-orange-500'
                                : 'bg-blue-500'
                            }`}
                            style={{ height: `${(value / 200) * 100}%` }}
                          ></div>
                          <div className="text-xs text-gray-500 mt-1">{trends.labels[idx]}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Devices */}
              <div className="bg-white border rounded-2xl p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                  <Zap className="w-6 h-6 mr-3 text-orange-600" />
                  Connected Devices
                </h3>
                <div className="space-y-4">
                  {devices.map((device) => (
                    <div
                      key={device._id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-orange-50"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-lg ${
                          device.connected
                            ? 'bg-orange-100 text-orange-600'
                            : 'bg-gray-100 text-gray-400'
                        }`}>
                          <Activity className="w-6 h-6" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-800">{device.name}</h4>
                          <div className="flex items-center gap-3 text-sm text-gray-600">
                            <span className="capitalize">{device.type}</span>
                            <span className="flex items-center">
                              <Battery className="w-4 h-4 mr-1" />
                              {device.battery}%
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          device.connected
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {device.connected ? 'Connected' : 'Disconnected'}
                        </span>
                        <button 
                          onClick={() => handleDeleteDevice(device._id)}
                          className="text-gray-400 hover:text-red-600">
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="lg:w-96">
              {/* Today's Medications */}
              <div className="bg-white border rounded-2xl p-6 mb-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-800 flex items-center">
                    <Bell className="w-6 h-6 mr-3 text-orange-600" />
                    Today's Medications
                  </h3>
                  <span className="text-sm text-gray-500">{new Date().toLocaleDateString()}</span>
                </div>
                <div className="space-y-4">
                  {medications.map((med) => (
                    <div
                      key={med._id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div>
                        <h4 className="font-medium text-gray-800">{med.name}</h4>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                          <span className="flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            {med.time}
                          </span>
                          <span>{med.dosage}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => toggleMedication(med._id)}
                        className={`w-12 h-6 rounded-full transition-colors ${
                          med.taken
                            ? 'bg-green-500'
                            : 'bg-gray-300'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-full bg-white transform transition-transform ${
                          med.taken ? 'translate-x-7' : 'translate-x-1'
                        }`}></div>
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Health Reminders */}
              <div className="bg-white border rounded-2xl p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                  <Calendar className="w-6 h-6 mr-3 text-orange-600" />
                  Health Reminders
                </h3>
                <div className="space-y-4">
                  {reminders.map((reminder) => (
                    <div
                      key={reminder._id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded ${
                          reminder.active
                            ? 'bg-orange-100 text-orange-600'
                            : 'bg-gray-100 text-gray-400'
                        }`}>
                          <Bell className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-800">{reminder.action}</h4>
                          <div className="text-sm text-gray-600">{reminder.time}</div>
                        </div>
                      </div>
                      <button
                        onClick={() => toggleReminder(reminder._id)}
                        className={`w-12 h-6 rounded-full transition-colors ${
                          reminder.active
                            ? 'bg-orange-500'
                            : 'bg-gray-300'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-full bg-white transform transition-transform ${
                          reminder.active ? 'translate-x-7' : 'translate-x-1'
                        }`}></div>
                      </button>
                    </div>
                  ))}
                </div>

                <button 
                  onClick={() => setShowAddReminder(true)}
                  className="w-full mt-6 flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 text-gray-600 py-3 rounded-lg hover:bg-gray-50">
                  <Plus className="w-5 h-5" />
                  Add New Reminder
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Health Insights */}
        <div className="grid md:grid-cols-3 gap-6 mt-8">
          {[
            {
              icon: <LineChart className="w-8 h-8" />,
              title: 'Weekly Report',
              desc: 'Detailed analysis of your health trends',
              action: 'View Report'
            },
            {
              icon: <AlertCircle className="w-8 h-8" />,
              title: 'Health Alerts',
              desc: 'Get notified about concerning trends',
              action: 'Configure Alerts'
            },
            {
              icon: <CheckCircle className="w-8 h-8" />,
              title: 'Progress Goals',
              desc: 'Track your health improvement goals',
              action: 'Set Goals'
            }
          ].map((feature, idx) => (
            <div key={idx} className="bg-white p-6 rounded-2xl shadow text-center">
              <div className="text-orange-600 flex justify-center mb-4">
                {feature.icon}
              </div>
              <h3 className="font-bold text-gray-800 mb-2">{feature.title}</h3>
              <p className="text-sm text-gray-600 mb-4">{feature.desc}</p>
              <button 
                onClick={() => {
                  if (idx === 0) setShowWeeklyReport(true);
                  else if (idx === 1) setShowAlerts(true);
                  else if (idx === 2) setShowGoals(true);
                }}
                className="text-orange-600 hover:text-orange-700 font-medium">
                {feature.action}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ==================== MODALS ==================== */}

      {/* Add Device Modal */}
      {showAddDevice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Add Device</h2>
              <button onClick={() => setShowAddDevice(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleAddDevice} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Device Name</label>
                <input
                  type="text"
                  value={deviceForm.name}
                  onChange={(e) => setDeviceForm({...deviceForm, name: e.target.value})}
                  placeholder="e.g., Smart Watch"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Device Type</label>
                <select
                  value={deviceForm.type}
                  onChange={(e) => setDeviceForm({...deviceForm, type: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="wearable">Wearable</option>
                  <option value="device">Device</option>
                  <option value="smartphone">Smartphone</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Manufacturer</label>
                <input
                  type="text"
                  value={deviceForm.manufacturer}
                  onChange={(e) => setDeviceForm({...deviceForm, manufacturer: e.target.value})}
                  placeholder="e.g., Apple"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddDevice(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                >
                  Add Device
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Reminder Modal */}
      {showAddReminder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Add Reminder</h2>
              <button onClick={() => setShowAddReminder(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleAddReminder} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Time</label>
                <input
                  type="time"
                  value={reminderForm.time}
                  onChange={(e) => setReminderForm({...reminderForm, time: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Action</label>
                <input
                  type="text"
                  value={reminderForm.action}
                  onChange={(e) => setReminderForm({...reminderForm, action: e.target.value})}
                  placeholder="e.g., Take medication"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                <select
                  value={reminderForm.reminderType}
                  onChange={(e) => setReminderForm({...reminderForm, reminderType: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="medication">Medication</option>
                  <option value="measurement">Measurement</option>
                  <option value="activity">Activity</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddReminder(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                >
                  Add Reminder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Weekly Report Modal */}
      {showWeeklyReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Weekly Health Report</h2>
              <button onClick={() => setShowWeeklyReport(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                  <h4 className="font-medium text-gray-800 mb-2">Average Heart Rate</h4>
                  <p className="text-2xl font-bold text-blue-600">72 bpm</p>
                  <p className="text-sm text-gray-600">Normal range: 60-100 bpm</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
                  <h4 className="font-medium text-gray-800 mb-2">Average Blood Pressure</h4>
                  <p className="text-2xl font-bold text-green-600">120/80 mmHg</p>
                  <p className="text-sm text-gray-600">Healthy range</p>
                </div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-800 mb-3">Week Summary</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>✓ Medications taken: 28/28 (100%)</li>
                  <li>✓ Health reminders: 21/21 (100%)</li>
                  <li>✓ Avg. sleep: 7.5 hours</li>
                  <li>✓ Steps: 45,230 (Average: 6,460/day)</li>
                </ul>
              </div>
              <button onClick={() => setShowWeeklyReport(false)} className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Health Alerts Modal */}
      {showAlerts && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Configure Health Alerts</h2>
              <button onClick={() => setShowAlerts(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              {[
                { type: 'High Blood Pressure', threshold: '> 140/90 mmHg', enabled: true },
                { type: 'Low Blood Pressure', threshold: '< 90/60 mmHg', enabled: false },
                { type: 'High Heart Rate', threshold: '> 100 bpm', enabled: true },
                { type: 'Low Oxygen', threshold: '< 95%', enabled: true }
              ].map((alert, idx) => (
                <div key={idx} className="p-4 border rounded-lg flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-800">{alert.type}</h4>
                    <p className="text-sm text-gray-600">Threshold: {alert.threshold}</p>
                  </div>
                  <button className={`w-12 h-6 rounded-full transition-colors ${alert.enabled ? 'bg-orange-500' : 'bg-gray-300'}`}>
                    <div className={`w-4 h-4 rounded-full bg-white transform transition-transform ${alert.enabled ? 'translate-x-7' : 'translate-x-1'}`}></div>
                  </button>
                </div>
              ))}
              <button onClick={() => setShowAlerts(false)} className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Health Goals Modal */}
      {showGoals && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Health Goals</h2>
              <button onClick={() => setShowGoals(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              {goals.length > 0 ? goals.map((goal) => (
                <div key={goal._id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-800">{goal.title}</h4>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      goal.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                    }`}>
                      {goal.status}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                    <div className="bg-orange-600 h-2 rounded-full" style={{width: `${goal.progress}%`}}></div>
                  </div>
                  <p className="text-sm text-gray-600">{goal.progress}% complete</p>
                </div>
              )) : (
                <p className="text-gray-600">No goals set yet. Create one to get started!</p>
              )}
              <button onClick={() => setShowGoals(false)} className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MonitoringPage