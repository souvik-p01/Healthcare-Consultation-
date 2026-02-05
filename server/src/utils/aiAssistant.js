const axios = require('axios');

class AIAssistant {
  constructor(apiKey) {
    this.apiKey = apiKey || process.env.OPENAI_API_KEY;
    this.enabled = process.env.AI_ASSISTANT_ENABLED === 'true';
  }
  
  async analyzeTestResults(testData) {
    if (!this.enabled || !this.apiKey) {
      return {
        success: false,
        message: 'AI Assistant is disabled or API key is missing'
      };
    }
    
    try {
      const prompt = `
        Analyze the following laboratory test results and provide insights:
        
        Test Type: ${testData.testType}
        Patient Age: ${testData.patient?.age}
        Patient Gender: ${testData.patient?.gender}
        
        Test Parameters:
        ${testData.testParameters?.map(param => 
          `${param.name}: ${param.value} ${param.unit} (Normal Range: ${param.normalRange})`
        ).join('\n')}
        
        Provide:
        1. Summary of findings
        2. Abnormal values and their significance
        3. Possible conditions to consider
        4. Recommendations for further testing if needed
        5. Any critical alerts
      `;
      
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a medical laboratory expert assistant. Provide accurate, concise analysis of lab test results. Always mention if values are within normal ranges or abnormal.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 500,
          temperature: 0.3
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return {
        success: true,
        analysis: response.data.choices[0]?.message?.content,
        model: response.data.model,
        usage: response.data.usage
      };
      
    } catch (error) {
      console.error('AI Analysis Error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message
      };
    }
  }
  
  async suggestEquipmentMaintenance(equipmentData) {
    if (!this.enabled || !this.apiKey) {
      return {
        success: false,
        message: 'AI Assistant is disabled'
      };
    }
    
    try {
      const prompt = `
        Based on the following equipment data, suggest maintenance actions:
        
        Equipment: ${equipmentData.name} (${equipmentData.type})
        Current Status: ${equipmentData.status}
        Temperature: ${equipmentData.specifications?.temperature?.current}°C
        Usage: ${equipmentData.specifications?.usage?.current}%
        Last Maintenance: ${equipmentData.maintenance?.lastMaintenance}
        Maintenance History: ${equipmentData.maintenance?.maintenanceHistory?.length} records
        
        Alerts: 
        ${equipmentData.alerts?.filter(a => !a.resolved).map(a => 
          `- ${a.type}: ${a.message} (${a.severity})`
        ).join('\n') || 'No active alerts'}
        
        Provide:
        1. Recommended maintenance schedule
        2. Potential issues to address
        3. Preventive measures
        4. Estimated downtime if maintenance is needed
      `;
      
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are an equipment maintenance specialist for medical laboratory equipment. Provide practical maintenance recommendations based on equipment data.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 400,
          temperature: 0.4
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return {
        success: true,
        suggestions: response.data.choices[0]?.message?.content,
        model: response.data.model
      };
      
    } catch (error) {
      console.error('AI Maintenance Suggestion Error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  async qualityControlCheck(testResults) {
    if (!this.enabled) {
      return {
        success: false,
        message: 'AI Assistant is disabled'
      };
    }
    
    // Simple rule-based quality check (can be enhanced with ML)
    const checks = [];
    let score = 100;
    
    // Check 1: All required fields present
    if (!testResults.testParameters || testResults.testParameters.length === 0) {
      checks.push({
        check: 'Test Parameters',
        status: 'Failed',
        message: 'No test parameters provided',
        impact: -20
      });
      score -= 20;
    }
    
    // Check 2: Values within reasonable ranges
    testResults.testParameters?.forEach(param => {
      if (param.value && param.normalRange) {
        const [min, max] = param.normalRange.split('-').map(v => parseFloat(v));
        const value = parseFloat(param.value);
        
        if (!isNaN(min) && !isNaN(max) && !isNaN(value)) {
          if (value < min * 0.5 || value > max * 1.5) {
            checks.push({
              check: `Parameter: ${param.name}`,
              status: 'Warning',
              message: `Value ${value} is significantly outside normal range ${param.normalRange}`,
              impact: -10
            });
            score -= 10;
          }
        }
      }
    });
    
    // Check 3: Turnaround time
    if (testResults.turnaroundTime > 480) { // 8 hours
      checks.push({
        check: 'Turnaround Time',
        status: 'Warning',
        message: `Turnaround time of ${testResults.turnaroundTime} minutes is high`,
        impact: -5
      });
      score -= 5;
    }
    
    // Ensure score doesn't go below 0
    score = Math.max(0, score);
    
    return {
      success: true,
      score: Math.round(score),
      checks,
      status: score >= 80 ? 'Passed' : score >= 60 ? 'Warning' : 'Failed',
      recommendations: checks.filter(c => c.status !== 'Passed').map(c => c.message)
    };
  }
}

module.exports = AIAssistant;