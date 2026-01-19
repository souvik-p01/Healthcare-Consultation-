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
  LineChart
} from 'lucide-react'

const MonitoringPage = () => {
  const [selectedMetric, setSelectedMetric] = useState('heart')
  const [devices, setDevices] = useState([
    { id: 1, name: 'Smart Watch', type: 'wearable', connected: true, battery: 85 },
    { id: 2, name: 'Blood Pressure Monitor', type: 'device', connected: true, battery: 60 },
    { id: 3, name: 'Glucose Meter', type: 'device', connected: false, battery: 0 }
  ])

  const vitals = {
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
  }

  const medications = [
    { name: 'Metformin 500mg', time: '08:00 AM', dosage: '1 tablet', taken: true },
    { name: 'Lisinopril 10mg', time: '09:00 AM', dosage: '1 tablet', taken: true },
    { name: 'Atorvastatin 20mg', time: '08:00 PM', dosage: '1 tablet', taken: false },
    { name: 'Vitamin D3 1000IU', time: '10:00 AM', dosage: '1 softgel', taken: false }
  ]

  const trends = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    heartRate: [72, 75, 70, 68, 74, 72, 71],
    bloodPressure: [120, 118, 122, 119, 121, 120, 118]
  }

  const [reminders, setReminders] = useState([
    { id: 1, time: '08:00 AM', action: 'Take morning medications', active: true },
    { id: 2, time: '01:00 PM', action: 'Measure blood pressure', active: true },
    { id: 3, time: '07:00 PM', action: 'Evening walk 30 mins', active: false },
    { id: 4, time: '10:00 PM', action: 'Take night medications', active: true }
  ])

  const toggleReminder = (id) => {
    setReminders(prev =>
      prev.map(reminder =>
        reminder.id === id
          ? { ...reminder, active: !reminder.active }
          : reminder
      )
    )
  }

  const toggleMedication = (index) => {
    const newMedications = [...medications]
    newMedications[index].taken = !newMedications[index].taken
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
              <button className="flex items-center gap-2 bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700">
                <Plus className="w-5 h-5" />
                Add Device
              </button>
              <button className="flex items-center gap-2 border border-orange-600 text-orange-600 px-6 py-3 rounded-lg hover:bg-orange-50">
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
                      key={device.id}
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
                        <button className="text-gray-400 hover:text-gray-600">
                          <Settings className="w-5 h-5" />
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
                  {medications.map((med, idx) => (
                    <div
                      key={idx}
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
                        onClick={() => toggleMedication(idx)}
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
                      key={reminder.id}
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
                        onClick={() => toggleReminder(reminder.id)}
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

                <button className="w-full mt-6 flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 text-gray-600 py-3 rounded-lg hover:bg-gray-50">
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
              <button className="text-orange-600 hover:text-orange-700 font-medium">
                {feature.action}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default MonitoringPage