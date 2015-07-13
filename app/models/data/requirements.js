var requirements = [
    {_id: '55974b2f3dc107cb75453818', name: 'Architecture', description: '', topic: 'Technology', popularity: 50},
    {_id: '55974b303dc107cb75453819', name: 'Fit to customer infrastructure', description: '', topic: 'Technology', popularity: 70},
    {_id: '55974b303dc107cb7545381a', name: 'Can be distributed', description: '', topic: 'Technology', popularity: 60},
    {_id: '55974b313dc107cb7545381b', name: 'Quick and easy deployment', description: '', topic: 'Technology', popularity: 85},
    {_id: '55974b323dc107cb7545381c', name: 'Cost of ownership as low as possible', description: '', topic: 'Technology', popularity: 95},
    {_id: '55974b323dc107cb7545381d', name: 'Minimal impact on servers and end points', description: '', topic: 'Technology', popularity: 90},
    {_id: '55974b333dc107cb7545381e', name: 'Can work in parallel to other tools', description: '', topic: 'Technology', popularity: 90},
    {_id: '55974b333dc107cb7545381f', name: 'Minimal false positives', description: '', topic: 'Technology', popularity: 45},
    {_id: '55974b343dc107cb75453820', name: 'Integration with management control and monitoring systems', description: '', topic: 'Technology', popularity: 70},

    {_id: '55974b343dc107cb75453821', name: 'Vendor', description: 'Provide some details about the vendor', topic: 'Vendor, Reseller & Integrator', popularity: 90},
    {_id: '55974b343dc107cb75453821', name: 'Level of expertise on the product', description: '', topic: 'Vendor, Reseller & Integrator', popularity: 90},
    {_id: '55974b353dc107cb75453822', name: 'Experience deploying this product in similar organizations', description: '', topic: 'Vendor, Reseller & Integrator', popularity: 80},
    {_id: '55974b353dc107cb75453823', name: 'Number of deployments in this country and world wide', description: '', topic: 'Vendor, Reseller & Integrator', popularity: 70},
    {_id: '55974b363dc107cb75453824', name: 'Relevant customers', description: '', topic: 'Vendor, Reseller & Integrator', popularity: 55},
    {_id: '55974b373dc107cb75453825', name: 'Support Service Level Agreement (SLA)', description: 'What is the SLA that this vendor / reseller / integrator offers?', topic: 'Vendor, Reseller & Integrator', popularity: 60},

    {_id: '55974b373dc107cb75453826', name: 'Vendor', description: 'How risky is this vendor?', topic: 'Risk management', popularity: 45},
    {_id: '55974b383dc107cb75453827', name: 'Development, Deployment and Complexity', description: '', topic: 'Risk management', popularity: 55},
    {_id: '559cf83dd21e2f6d44eb6408', name: 'Future roadmap and upgrades', description: 'Risk involved with future versions', topic: 'Risk management', popularity: 90},
    {_id: '559cf848d21e2f6d44eb6409', name: 'Vendor Locking', description: 'Does choosing this solution lock us on this vendor?', topic: 'Risk management', popularity: 75}, 
    {_id: '559cfa63d21e2f6d44eb6413', name: 'Migration Complexity', description: 'How complex will it be to migrate from the current solution to this new one?', topic: 'Risk management', popularity: 45}, 

    {_id: '55974b393dc107cb75453829', name: 'Security', description: 'Level of security of data storage, passwords, etc. Usage of SingleSignOn, Two factor authentication, etc.', topic: 'System Interfaces and user management', popularity: 45},
    {_id: '55974b3a3dc107cb7545382a', name: 'Hardenning according to procedure', description: '', topic: 'System Interfaces and user management', popularity: 45},
    {_id: '55974b3a3dc107cb7545382b', name: 'Different user profiles', description: '', topic: 'System Interfaces and user management', popularity: 70},
    {_id: '55974b3b3dc107cb7545382c', name: 'Logging of management system user access', description: '', topic: 'System Interfaces and user management', popularity: 70},

    {_id: '55974bf43dc107cb7545382d', name: 'Zero Day', description: 'Finding unknown attacks', topic: 'Threat Prevention Functionality', popularity: 50},
    {_id: '55974bf53dc107cb7545382e', name: 'Finding Advanced Persistent Threats', description: 'Before the attack happens', topic: 'Threat Prevention Functionality', popularity: 70},
    {_id: '55974bf53dc107cb7545382f', name: 'Finding Known malware', description: '', topic: 'Threat Prevention Functionality', popularity: 60},
    {_id: '55974bf63dc107cb75453830', name: 'Finding malware that already exist in the organization', description: '', topic: 'Threat Prevention Functionality', popularity: 85},
    {_id: '55974bf63dc107cb75453831', name: 'Protecting home grown applications', description: '', topic: 'Threat Prevention Functionality', popularity: 95},
    {_id: '55974bf73dc107cb75453832', name: 'Logging and displaying the entire attack information', description: 'Attack type and name, IP addresses, Time, Involved Processes, Action taken by the malware, etc. ', topic: 'Threat Prevention Functionality', popularity: 90},
    {_id: '55974bf83dc107cb75453833', name: 'Granular policy', description: 'Writing specific rules tailored for the organization', topic: 'Threat Prevention Functionality', popularity: 90},
    {_id: '55974bf83dc107cb75453834', name: 'Forensics', description: 'Event investigation and treatment recommendations, incl. identifying other infected server and malware removal', topic: 'Threat Prevention Functionality', popularity: 45},
    {_id: '55974bf93dc107cb75453835', name: 'Finding the attack in real time', description: 'When it happens', topic: 'Threat Prevention Functionality', popularity: 70},

    {_id: '55974bf93dc107cb75453836', name: 'Integration with Arcsight', description: '', topic: 'Threat Prevention Functionality', popularity: 85},
    {_id: '55974bfa3dc107cb75453837', name: 'Ease of use and flexibility in creating management reports', description: '', topic: 'Threat Prevention Functionality', popularity: 95},
    {_id: '55974bfa3dc107cb75453838', name: 'Integration with 24x7 SOC', description: 'Integration with 24x7 SOC', topic: 'Threat Prevention Functionality', popularity: 90},
    {_id: '55974bfb3dc107cb75453839', name: 'On Demand file clearance', description: '', topic: 'Threat Prevention Functionality', popularity: 90},
    {_id: '55974bfb3dc107cb7545383a', name: 'Integration with 3rd party anti virus providers', description: 'Like Virus Total and NIST', topic: 'Threat Prevention Functionality', popularity: 45},
    {_id: '55974bfc3dc107cb7545383b', name: 'SLA', description: 'Vendor should commit to respond on real time attacks according to the priority level of the attack', topic: 'Threat Prevention Functionality', popularity: 70},

    {_id: '559cf8cbd21e2f6d44eb640a', name: 'Answers to business requirement', description: 'How this solution meets the business requirements defined for it by the company', topic: 'Impact on the Company', popularity: 85},
    {_id: '559cf8d8d21e2f6d44eb640b', name: 'Time to market', description: 'How quickly the solution will be up and running', topic: 'Impact on the Company', popularity: 95}, 
    {_id: '559cf8dfd21e2f6d44eb640c', name: 'Delivers while adopting', description: 'Flexibility of the solution to change and remain fully operational', topic: 'Impact on the Company', popularity: 90},
    {_id: '559cf8e8d21e2f6d44eb640d', name: 'Delivers competitive advantage', description: 'Whether this technology is a differentiation over the competition', topic: 'Impact on the Company', popularity: 90},
     {_id: '559cf8f2d21e2f6d44eb640e', name: 'Solves immediate need and as well as coming technology challenges', description: 'How this solution fits the problem now and expected to fit in the future', topic: 'Impact on the Company', popularity: 45},

    {_id: '559cf8fcd21e2f6d44eb640f', name: 'Price', description: 'How much this solution cost. Monthly / Annually / or one time payment.', topic: 'Cost', popularity: 99}, 
    {_id: '559cf907d21e2f6d44eb6410', name: 'Cost of Ownership', description: 'Adding other parameters to the calculation, like internal resources.', topic: 'Cost', popularity: 95}, 
    {_id: '559cf90fd21e2f6d44eb6411', name: 'Return on Investment', description: 'Measuring if the solution will return its cost, how and when.', topic: 'Cost', popularity: 90}, 
    {_id: '559cf918d21e2f6d44eb6412', name: 'Cost structure', description: 'One time or recurrent. Product vs. service. Vendor vs. Integrator, etc.', topic: 'Cost', popularity: 90} 

];


module.exports = {
    requirements: requirements
};
