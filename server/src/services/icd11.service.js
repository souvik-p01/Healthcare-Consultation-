/**
 * ICD-11 Mapping Service
 * 
 * Maps predicted clinical conditions to standard ICD-11 codes.
 */

const ICD11_MAP = {
    "influenza": { code: "1B10", name: "Influenza" },
    "flu": { code: "1B10", name: "Influenza" },
    "covid-19": { code: "RA01", name: "COVID-19" },
    "covid": { code: "RA01", name: "COVID-19" },
    "dengue fever": { code: "1D40.0", name: "Dengue" },
    "dengue": { code: "1D40.0", name: "Dengue" },
    "malaria": { code: "1F40", name: "Malaria" },
    "typhoid": { code: "1A07.0", name: "Typhoid fever" },
    "typhoid fever": { code: "1A07.0", name: "Typhoid fever" },
    "viral gastroenteritis": { code: "1A40.0", name: "Viral gastroenteritis" },
    "gastroenteritis": { code: "1A40", name: "Infectious gastroenteritis" },
    "acute bronchitis": { code: "CA41.0", name: "Acute bronchitis" },
    "bronchitis": { code: "CA41.0", name: "Acute bronchitis" },
    "migraine": { code: "8A80", name: "Migraine" },
    "tension headache": { code: "8A81.0", name: "Tension headache" },
    "angina pectoris": { code: "BD40.0", name: "Angina pectoris" },
    "angina": { code: "BD40.0", name: "Angina pectoris" },
    "pneumonia": { code: "CA40", name: "Pneumonia" },
    "common cold": { code: "CA02", name: "Acute nasopharyngitis" },
    "cold": { code: "CA02", name: "Acute nasopharyngitis" },
    "asthma": { code: "CA23", name: "Asthma" },
    "tuberculosis": { code: "1B10", name: "Tuberculosis" },
    "tb": { code: "1B10", name: "Tuberculosis" }
};

/**
 * Map clinical condition to standard ICD-11 Code
 */
export const mapConditionToIcd11 = (conditionName) => {
    const cleanText = conditionName.toLowerCase().trim();
    
    // 1. Direct match check
    if (ICD11_MAP[cleanText]) {
        return {
            name: ICD11_MAP[cleanText].name,
            code: ICD11_MAP[cleanText].code
        };
    }
    
    // 2. Substring match check
    const keys = Object.keys(ICD11_MAP);
    for (const key of keys) {
        if (cleanText.includes(key) || key.includes(cleanText)) {
            return {
                name: ICD11_MAP[key].name,
                code: ICD11_MAP[key].code
            };
        }
    }
    
    // 3. Fallback to general code
    return {
        name: conditionName,
        code: "MG48" // ICD-11 Symptoms, signs or clinical findings fallback
    };
};

export default {
    mapConditionToIcd11
};
