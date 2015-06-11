var requirements = [
    {name: 'Architecture', description: '', topic: 'Technology', popularity: 50},
    {name: 'Fit to customer infrastructure', description: '', topic: 'Technology', popularity: 70},
    {name: 'Can be distributed', description: '', topic: 'Technology', popularity: 60},
    {name: 'Quick and easy deployment', description: '', topic: 'Technology', popularity: 85},
    {name: 'Cost of ownership as low as possible', description: '', topic: 'Technology', popularity: 95},
    {name: 'Minimal impact on servers and end points', description: '', topic: 'Technology', popularity: 90},
    {name: 'Can work in parallel to other tools', description: '', topic: 'Technology', popularity: 90},
    {name: 'Minimal false positives', description: '', topic: 'Technology', popularity: 45},

    {name: 'Integration with management control and monitoring systems', description: '', topic: 'Technology', popularity: 70},
    {name: 'Level of expertise on the product', description: '', topic: 'Vendor, Reseller & Integrator', popularity: 90},
    {name: 'experience deploying this product in similar organizations', description: '', topic: 'Vendor, Reseller & Integrator', popularity: 90},
    {name: 'Number of deployments in this country and world wide', description: '', topic: 'Vendor, Reseller & Integrator', popularity: 80},
    {name: 'Relevant customers', description: '', topic: 'Vendor, Reseller & Integrator', popularity: 75},
    {name: 'Support Service Level Agreement (SLA)', description: '', topic: 'Vendor, Reseller & Integrator', popularity: 80},

    {name: 'Vendor', description: '', topic: 'Risk management', popularity: 45},
    {name: 'Development, Deployment and Complexity', description: '', topic: 'Risk management', popularity: 45},
    {name: 'Future roadmap and upgrades', description: '', topic: 'Risk management', popularity: 70},

    {name: 'Security', description: 'Level of security of data storage, passwords, etc. Usage of SingleSignOn, Two factor authentication, etc.', topic: 'System Interfaces and user management', popularity: 45},
    {name: 'Hardenning according to procedure', description: '', topic: 'System Interfaces and user management', popularity: 45},
    {name: 'Different user profiles', description: '', topic: 'System Interfaces and user management', popularity: 70},
    {name: 'Logging of management system user access', description: '', topic: 'System Interfaces and user management', popularity: 70},


    {name: 'Zero Day', description: 'Finding unknown attacks', topic: 'Threat Prevention Functionality', popularity: 50},
    {name: 'Finding Advanced Persistent Threats', description: 'Before the attack happens', topic: 'Threat Prevention Functionality', popularity: 70},
    {name: 'Finding Known malware', description: '', topic: 'Threat Prevention Functionality', popularity: 60},
    {name: 'Finding malware that already exist in the organization', description: '', topic: 'Threat Prevention Functionality', popularity: 85},
    {name: 'Protecting home grown applications', description: '', topic: 'Threat Prevention Functionality', popularity: 95},
    {name: 'Logging and displaying the entire attack information', description: 'Attack type and name, IP addresses, Time, Involved Processes, Action taken by the malware, etc. ', topic: 'Threat Prevention Functionality', popularity: 90},
    {name: 'Granular policy', description: 'Writing specific rules tailored for the organization', topic: 'Threat Prevention Functionality', popularity: 90},
    {name: 'Forensics', description: 'Event investigation and treatment recommendations, incl. identifying other infected server and malware removal', topic: 'Threat Prevention Functionality', popularity: 45},
    {name: 'Finding the attack in real time', description: 'When it happens', topic: 'Threat Prevention Functionality', popularity: 70},

    {name: 'Integration with Arcsight', description: '', topic: 'Threat Prevention Functionality', popularity: 85},
    {name: 'Ease of use and flexibility in creating management reports', description: '', topic: 'Threat Prevention Functionality', popularity: 95},
    {name: 'Integration with 24x7 SOC', description: 'Integration with 24x7 SOC', topic: 'Threat Prevention Functionality', popularity: 90},
    {name: 'On Demand file clearance', description: '', topic: 'Threat Prevention Functionality', popularity: 90},
    {name: 'Integration with 3rd party anti virus providers', description: 'Like Virus Total and NIST', topic: 'Threat Prevention Functionality', popularity: 45},
    {name: 'SLA', description: 'Vendor should commit to respond on real time attacks according to the priority level of the attack', topic: 'Threat Prevention Functionality', popularity: 70}
];

module.exports = {
    requirements: requirements
};
