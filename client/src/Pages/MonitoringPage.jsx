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
  healthGoalService,
  healthSettingsService
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
  const [goalForm, setGoalForm] = useState({ title: '', targetValue: '', currentValue: '0', unit: '' })
  const [settingsForm, setSettingsForm] = useState({ language: 'en', preferredContactMethod: 'email', notifications: { email: true, sms: true, push: true } })
  
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
      const [metricsRes, devicesRes, medicationsRes, remindersRes, alertsRes, goalsRes, settingsRes] = await Promise.allSettled([
        healthMetricsService.getLatestMetrics(),
        deviceService.getDevices(),
        medicationService.getMedications(),
        reminderService.getReminders(),
        healthAlertService.getAlerts(),
        healthGoalService.getGoals(),
        healthSettingsService.getSettings()
      ])

      // Handle metrics
      if (metricsRes.status === 'fulfilled' && metricsRes.value.data?.success) {
        const metricsData = metricsRes.value.data.data
        setVitals(formatVitals(metricsData))
      } else {
        setVitals(getDefaultVitals())
      }

      // Handle devices
      if (devicesRes.status === 'fulfilled' && devicesRes.value.data?.success) {
        setDevices(devicesRes.value.data.data)
      } else {
        setDevices([])
      }

      // Handle medications
      if (medicationsRes.status === 'fulfilled' && medicationsRes.value.data?.success) {
        setMedications(medicationsRes.value.data.data)
      } else {
        setMedications([])
      }

      // Handle reminders
      if (remindersRes.status === 'fulfilled' && remindersRes.value.data?.success) {
        setReminders(remindersRes.value.data.data)
      } else {
        setReminders([])
      }

      // Handle alerts
      if (alertsRes.status === 'fulfilled' && alertsRes.value.data?.success) {
        setAlerts(alertsRes.value.data.data)
      } else {
        setAlerts([])
      }

      // Handle goals
      if (goalsRes.status === 'fulfilled' && goalsRes.value.data?.success) {
        setGoals(goalsRes.value.data.data)
      } else {
        setGoals([])
      }

      // Handle settings
      if (settingsRes.status === 'fulfilled' && settingsRes.value.data?.success) {
        setSettingsForm(settingsRes.value.data.data)
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
      
      if (heartRes.data?.success && bpRes.data?.success) {
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
    const defaults = getDefaultVitals()
    return {
      heart: metricsData.heart_rate ? {
        ...defaults.heart,
        value: metricsData.heart_rate.value,
        status: metricsData.heart_rate.status,
        trend: metricsData.heart_rate.trend
      } : defaults.heart,
      bp: metricsData.blood_pressure ? {
        ...defaults.bp,
        systolic: metricsData.blood_pressure.systolic,
        diastolic: metricsData.blood_pressure.diastolic,
        status: metricsData.blood_pressure.status,
        trend: metricsData.blood_pressure.trend
      } : defaults.bp,
      temp: metricsData.temperature ? {
        ...defaults.temp,
        value: metricsData.temperature.value,
        status: metricsData.temperature.status,
        trend: metricsData.temperature.trend
      } : defaults.temp,
      oxygen: metricsData.blood_oxygen ? {
        ...defaults.oxygen,
        value: metricsData.blood_oxygen.value,
        status: metricsData.blood_oxygen.status,
        trend: metricsData.blood_oxygen.trend
      } : defaults.oxygen
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
      if (res.data?.success) {
        setDevices([res.data.data, ...devices])
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
      if (res.data?.success) {
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
      if (res.data?.success) {
        setDevices(devices.filter(d => d._id !== deviceId))
      }
    } catch (err) {
      console.error('Error deleting device:', err)
    }
  }

  const toggleAlertEnabled = async (alertId, currentEnabled) => {
    try {
      const res = await healthAlertService.updateAlert(alertId, { enabled: !currentEnabled })
      if (res.data?.success) {
        setAlerts(prev => prev.map(a => a._id === alertId ? { ...a, enabled: !currentEnabled } : a))
      }
    } catch (err) {
      console.error('Error toggling alert:', err)
    }
  }

  const handleAddGoal = async (e) => {
    e.preventDefault()
    try {
      const res = await healthGoalService.addGoal(goalForm)
      if (res.data?.success) {
        setGoals([res.data.data, ...goals])
        setGoalForm({ title: '', targetValue: '', currentValue: '0', unit: '' })
      }
    } catch (err) {
      console.error('Error creating goal:', err)
    }
  }

  const handleSaveSettings = async (e) => {
    e.preventDefault()
    try {
      const res = await healthSettingsService.updateSettings(settingsForm)
      if (res.data?.success) {
        setSettingsForm(res.data.data)
        setShowSettings(false)
      }
    } catch (err) {
      console.error('Error saving settings:', err)
    }
  }

  // Calculate dynamic data for Weekly Report
  const getWeeklyReportStats = () => {
    const heartSum = trends.heartRate.reduce((a, b) => a + b, 0)
    const avgHeart = trends.heartRate.length > 0 ? Math.round(heartSum / trends.heartRate.length) : 72

    const bpSum = trends.bloodPressure.reduce((a, b) => a + b, 0)
    const avgSystolic = trends.bloodPressure.length > 0 ? Math.round(bpSum / trends.bloodPressure.length) : 120
    const avgDiastolic = 80 // Base estimate

    const totalMeds = medications.length
    const takenMeds = medications.filter(m => m.taken).length
    const medsPercent = totalMeds > 0 ? Math.round((takenMeds / totalMeds) * 100) : 0

    const totalReminders = reminders.length
    const activeReminders = reminders.filter(r => r.active).length
    const remindersPercent = totalReminders > 0 ? Math.round((activeReminders / totalReminders) * 100) : 0

    return {
      avgHeartRate: avgHeart,
      avgBP: { systolic: avgSystolic, diastolic: avgDiastolic },
      medsCount: { taken: takenMeds, total: totalMeds, percent: medsPercent },
      remindersCount: { active: activeReminders, total: totalReminders, percent: remindersPercent }
    }
  }

  const stats = getWeeklyReportStats()

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-orange-50 to-yellow-50">
        <Loader className="w-12 h-12 text-orange-600 animate-spin mb-4" />
        <p className="text-gray-600 font-medium">Syncing your health vitals...</p>
      </div>
    )
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
                <div className="text-2xl font-bold text-gray-800 text-left">
                  {key === 'bp' ? `${metric.systolic}/${metric.diastolic}` : metric.value}
                  <span className="text-sm text-gray-600 ml-1">{metric.unit}</span>
                </div>
                <div className="text-sm text-gray-600 mt-1 text-left">{metric.label}</div>
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
                          <TrendingUp className="w-4 h-4 mr-1 text-green-500" />
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
                  {devices.length > 0 ? devices.map((device) => (
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
                              <Battery className="w-4 h-4 mr-1 text-green-500" />
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
                  )) : (
                    <p className="text-gray-500 text-sm py-2">No connected devices found.</p>
                  )}
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
                  {medications.length > 0 ? medications.map((med) => (
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
                        className={`w-12 h-6 rounded-full transition-colors relative flex items-center ${
                          med.taken
                            ? 'bg-green-500'
                            : 'bg-gray-300'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-full bg-white absolute transition-transform ${
                          med.taken ? 'translate-x-7' : 'translate-x-1'
                        }`}></div>
                      </button>
                    </div>
                  )) : (
                    <p className="text-gray-500 text-sm py-2">No medications logged for today.</p>
                  )}
                </div>
              </div>

              {/* Health Reminders */}
              <div className="bg-white border rounded-2xl p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                  <Calendar className="w-6 h-6 mr-3 text-orange-600" />
                  Health Reminders
                </h3>
                <div className="space-y-4">
                  {reminders.length > 0 ? reminders.map((reminder) => (
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
                        className={`w-12 h-6 rounded-full transition-colors relative flex items-center ${
                          reminder.active
                            ? 'bg-orange-500'
                            : 'bg-gray-300'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-full bg-white absolute transition-transform ${
                          reminder.active ? 'translate-x-7' : 'translate-x-1'
                        }`}></div>
                      </button>
                    </div>
                  )) : (
                    <p className="text-gray-500 text-sm py-2">No active health reminders.</p>
                  )}
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
                <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg text-left">
                  <h4 className="font-medium text-gray-800 mb-2">Average Heart Rate</h4>
                  <p className="text-2xl font-bold text-blue-600">{stats.avgHeartRate} bpm</p>
                  <p className="text-sm text-gray-600">Normal range: 60-100 bpm</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg text-left">
                  <h4 className="font-medium text-gray-800 mb-2">Average Blood Pressure</h4>
                  <p className="text-2xl font-bold text-green-600">{stats.avgBP.systolic}/{stats.avgBP.diastolic} mmHg</p>
                  <p className="text-sm text-gray-600">Healthy range</p>
                </div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg text-left">
                <h4 className="font-medium text-gray-800 mb-3">Week Summary</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>✓ Medications taken: {stats.medsCount.taken}/{stats.medsCount.total} ({stats.medsCount.percent}%)</li>
                  <li>✓ Health reminders: {stats.remindersCount.active}/{stats.remindersCount.total} active ({stats.remindersCount.percent}% active)</li>
                  <li>✓ Connected devices: {devices.filter(d => d.connected).length} active</li>
                </ul>
              </div>
              <button onClick={() => setShowWeeklyReport(false)} className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-semibold">
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
              {alerts.length > 0 ? alerts.map((alert) => (
                <div key={alert._id} className="p-4 border rounded-lg flex items-center justify-between text-left">
                  <div>
                    <h4 className="font-medium text-gray-800">{alert.type}</h4>
                    <p className="text-sm text-gray-600">Threshold: {alert.threshold}</p>
                  </div>
                  <button
                    onClick={() => toggleAlertEnabled(alert._id, alert.enabled)}
                    className={`w-12 h-6 rounded-full transition-colors relative flex items-center ${alert.enabled ? 'bg-orange-500' : 'bg-gray-300'}`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white absolute transition-transform ${alert.enabled ? 'translate-x-7' : 'translate-x-1'}`}></div>
                  </button>
                </div>
              )) : (
                <p className="text-gray-500 text-sm py-2">No alerts configured yet.</p>
              )}
              <button onClick={() => setShowAlerts(false)} className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-semibold">
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
            <div className="space-y-6 text-left">
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
                    <p className="text-sm text-gray-600">{goal.progress}% complete ({goal.currentValue || 0} / {goal.targetValue})</p>
                  </div>
                )) : (
                  <p className="text-gray-600 text-sm">No goals set yet. Create one to get started!</p>
                )}
              </div>

              {/* Goal creation Form */}
              <form onSubmit={handleAddGoal} className="border-t pt-4 space-y-3">
                <h4 className="font-semibold text-gray-800 text-left">Add New Goal</h4>
                <div className="grid grid-cols-2 gap-2 text-left">
                  <div className="col-span-2">
                    <input
                      type="text"
                      placeholder="Goal Title (e.g. Daily Steps)"
                      value={goalForm.title}
                      onChange={(e) => setGoalForm({...goalForm, title: e.target.value})}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500 text-sm"
                      required
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="Target (e.g. 10000)"
                      value={goalForm.targetValue}
                      onChange={(e) => setGoalForm({...goalForm, targetValue: e.target.value})}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500 text-sm"
                      required
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="Unit (e.g. steps)"
                      value={goalForm.unit}
                      onChange={(e) => setGoalForm({...goalForm, unit: e.target.value})}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500 text-sm"
                      required
                    />
                  </div>
                </div>
                <button type="submit" className="w-full py-2 bg-orange-600 text-white rounded hover:bg-orange-700 font-semibold text-sm">
                  Create Goal
                </button>
              </form>

              <button onClick={() => setShowGoals(false)} className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold text-sm">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-left">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Monitoring Settings</h2>
              <button onClick={() => setShowSettings(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Language</label>
                <select
                  value={settingsForm.language || 'en'}
                  onChange={(e) => setSettingsForm({...settingsForm, language: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="en">English</option>
                  <option value="es">Español</option>
                  <option value="fr">Français</option>
                  <option value="hi">Hindi</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Contact Method</label>
                <select
                  value={settingsForm.preferredContactMethod || 'email'}
                  onChange={(e) => setSettingsForm({...settingsForm, preferredContactMethod: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="email">Email</option>
                  <option value="sms">SMS</option>
                  <option value="push">Push Notification</option>
                </select>
              </div>
              
              <div className="space-y-2 pt-2">
                <h4 className="font-medium text-gray-700">Notification Alerts</h4>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Email Alerts</span>
                  <input 
                    type="checkbox" 
                    checked={settingsForm.notifications?.email !== false} 
                    onChange={(e) => setSettingsForm({
                      ...settingsForm, 
                      notifications: { ...settingsForm.notifications, email: e.target.checked }
                    })}
                    className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">SMS Alerts</span>
                  <input 
                    type="checkbox" 
                    checked={settingsForm.notifications?.sms !== false} 
                    onChange={(e) => setSettingsForm({
                      ...settingsForm, 
                      notifications: { ...settingsForm.notifications, sms: e.target.checked }
                    })}
                    className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Push Alerts</span>
                  <input 
                    type="checkbox" 
                    checked={settingsForm.notifications?.push !== false} 
                    onChange={(e) => setSettingsForm({
                      ...settingsForm, 
                      notifications: { ...settingsForm.notifications, push: e.target.checked }
                    })}
                    className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                  />
                </div>
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowSettings(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-semibold"
                >
                  Save Settings
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default MonitoringPage