var requirements;
requirements = [
    {
        _id: '55974b2f3dc107cb75453818',
        name: 'Architecture',
        description: 'On-premise, cloud or hybrid, agent-based or agent-less, etc.',
        topic: 'Technology',
        popularity: 90
    },
    {
        _id: '55974b303dc107cb75453819',
        name: 'Fit to infrastructure',
        description: 'Does the solution fit into the existing infrastructure and environment',
        topic: 'Technology',
        popularity: 80
    },
    {
        _id: '55974b313dc107cb7545381b',
        name: 'Deployment implications',
        description: 'Technological implications of deployment - storage, bandwidth, configuration changes, etc.',
        topic: 'Technology',
        popularity: 80
    },
    {
        _id: '55974b323dc107cb7545381d',
        name: 'Performance impact',
        description: 'The expected performance impact on servers, endpoints, or the network',
        topic: 'Technology',
        popularity: 90
    },
    {
        _id: '55ae12134c325a20daeac1e8',
        name: 'Technology maturity',
        description: 'How mature and proven is this technology?',
        topic: 'Technology',
        popularity: 70
    },

    {
        _id: '55a387e3ec285d678e3d7261',
        name: 'Vendor',
        description: 'Provide some details about the vendor',
        topic: 'Vendor, Reseller & Integrator',
        popularity: 90
    },
    {
        _id: '55974b343dc107cb75453821',
        name: 'Level of expertise on the product',
        description: 'The experience and exprtise level of the reseller or integrator',
        topic: 'Vendor, Reseller & Integrator',
        popularity: 90
    },
    {
        _id: '55974b353dc107cb75453822',
        name: 'Experience deploying this product in similar organizations',
        description: 'Has the integrator experienced similar scale, architecture, requirements, etc.?',
        topic: 'Vendor, Reseller & Integrator',
        popularity: 80
    },
    {
        _id: '55974b353dc107cb75453823',
        name: 'Number of deployments in this country and world wide',
        description: 'Understand the maturity and accumulated experience with the solution',
        topic: 'Vendor, Reseller & Integrator',
        popularity: 70
    },
    {
        _id: '55974b363dc107cb75453824',
        name: 'Relevant customers',
        description: 'Look for customers that can be references and had similar requirements and configurations',
        topic: 'Vendor, Reseller & Integrator',
        popularity: 55
    },
    {
        _id: '55974b373dc107cb75453825',
        name: 'Support Service Level Agreement (SLA)',
        description: 'What is the SLA that this vendor / reseller / integrator offers?',
        topic: 'Vendor, Reseller & Integrator',
        popularity: 60
    },

    {
        _id: '55974b373dc107cb75453826',
        name: 'Vendor',
        description: 'How risky is this vendor (financial stability, reputation, etc.)?',
        topic: 'Risk Factors',
        popularity: 45
    },
    {
        _id: '55974b383dc107cb75453827',
        name: 'Development, Deployment and Complexity',
        description: 'The complexity and amount of in-house development needed for deployment',
        topic: 'Risk Factors',
        popularity: 55
    },
    {
        _id: '559cf83dd21e2f6d44eb6408',
        name: 'Future roadmap and upgrades',
        description: 'Risk involved with future versions',
        topic: 'Risk Factors',
        popularity: 90
    },
    {
        _id: '559cf848d21e2f6d44eb6409',
        name: 'Vendor Locking',
        description: 'Does choosing this solution lock us to this vendor?',
        topic: 'Risk Factors',
        popularity: 75
    },
    {
        _id: '559cfa63d21e2f6d44eb6413',
        name: 'Migration Complexity',
        description: 'How complex will it be to migrate from the current solution to this new one?',
        topic: 'Risk Factors',
        popularity: 45
    },

    {
        _id: '55974b393dc107cb75453829',
        name: 'Security',
        description: 'Security of data storage, password strength, two factor authentication, etc.',
        topic: 'System Interfaces & Management Capabilities',
        popularity: 45
    },
    {
        _id: '55acbca44c325a20daeac1d7',
        name: 'Single Sign-on',
        description: 'Does it support Single Sign-on with our authentication solution (e.g. Active Directory)?',
        topic: 'System Interfaces & Management Capabilities',
        popularity: 50
    },
    {
        _id: '55974b3a3dc107cb7545382a',
        name: 'Security Hardening',
        description: 'Ability to harden the system (e.g minimum open ports, limiting Internet access, etc.) without breaking functionality',
        topic: 'System Interfaces & Management Capabilities',
        popularity: 45
    },
    {
        _id: '55974b3a3dc107cb7545382b',
        name: 'User profiles',
        description: 'Does it support giving different users/administrators different permissions?',
        topic: 'System Interfaces & Management Capabilities',
        popularity: 70
    },
    {
        _id: '55974b3b3dc107cb7545382c',
        name: 'Logging & Auditing',
        description: 'The level of logging available to monitor administrative operations and system behavior',
        topic: 'System Interfaces & Management Capabilities',
        popularity: 70
    },
    {
        _id: '55acc0a14c325a20daeac1d8',
        name: 'Built-in management tools',
        description: 'The quality and simplicity of the administration interfaces',
        topic: 'System Interfaces & Management Capabilities',
        popularity: 60
    },
    {
        _id: '55ae0dd54c325a20daeac1e7',
        name: 'External Management & Monitoring tools',
        description: 'Ability to integrate with 3rd party management and monitoring tools (SOC, NOC, etc.)',
        topic: 'System Interfaces & Management Capabilities',
        popularity: 60
    },
    {
        _id: '55b0ebe3749dae4268bbc2d4',
        name: 'Mobile compatibility',
        description: 'The type and quality of the Mobile interface - native app, responsive web-interface, etc.',
        topic: 'System Interfaces & Management Capabilities',
        popularity: 60
    },

    {
        _id: '559cf8cbd21e2f6d44eb640a',
        name: 'Answers the business requirement',
        description: 'How this solution meets the business requirements defined for it by the company',
        topic: 'Impact on the Company',
        popularity: 85
    },
    {
        _id: '559cf8d8d21e2f6d44eb640b',
        name: 'Time to market',
        description: 'How quickly the solution will be up and running',
        topic: 'Impact on the Company',
        popularity: 95
    },
    {
        _id: '559cf8dfd21e2f6d44eb640c',
        name: 'Delivers while adopting',
        description: 'Flexibility of the solution to change and remain fully operational',
        topic: 'Impact on the Company',
        popularity: 90
    },
    {
        _id: '559cf8e8d21e2f6d44eb640d',
        name: 'Delivers competitive advantage',
        description: 'Whether this technology is a differentiation over the competition',
        topic: 'Impact on the Company',
        popularity: 90
    },
    {
        _id: '559cf8f2d21e2f6d44eb640e',
        name: 'Solves immediate need and as well as coming technology challenges',
        description: 'How this solution fits the problem now and expected to fit in the future',
        topic: 'Impact on the Company',
        popularity: 45
    },

    {
        _id: '559cf8fcd21e2f6d44eb640f',
        name: 'Price',
        description: 'How much this solution cost. Monthly / Annually / or one time payment.',
        topic: 'Cost',
        popularity: 99
    },
    {
        _id: '559cf907d21e2f6d44eb6410',
        name: 'Cost of Ownership',
        description: 'Adding other parameters to the calculation, like internal resources.',
        topic: 'Cost',
        popularity: 95
    },
    {
        _id: '559cf90fd21e2f6d44eb6411',
        name: 'Return on Investment',
        description: 'Measuring if the solution will return its cost, how and when.',
        topic: 'Cost',
        popularity: 90
    },
    {
        _id: '559cf918d21e2f6d44eb6412',
        name: 'Cost structure',
        description: 'One time or recurrent. Product vs. service. Vendor vs. Integrator, etc.',
        topic: 'Cost',
        popularity: 90
    },

    {
        _id: '55974bf43dc107cb7545382d',
        name: 'Zero Day',
        description: 'Finding unknown attacks',
        topic: 'Threat Prevention Functionality',
        popularity: 50,
        category: 'Threat Prevention'
    },
    {
        _id: '55974bf53dc107cb7545382e',
        name: 'Finding Advanced Persistent Threats',
        description: 'Before the attack happens',
        topic: 'Threat Prevention Functionality',
        popularity: 70,
        category: 'Threat Prevention'
    },
    {
        _id: '55974bf53dc107cb7545382f',
        name: 'Finding known malware',
        description: 'Check that it identifies well-known malware',
        topic: 'Threat Prevention Functionality',
        popularity: 60,
        category: 'Threat Prevention'
    },
    {
        _id: '55974bf63dc107cb75453830',
        name: 'Finding malware that already exist in the organization',
        description: 'Does it find malware that has already infected?',
        topic: 'Threat Prevention Functionality',
        popularity: 85,
        category: 'Threat Prevention'
    },
    {
        _id: '55974bf63dc107cb75453831',
        name: 'Protecting home grown applications',
        description: 'Can it be updated to protect applications developed in-house?',
        topic: 'Threat Prevention Functionality',
        popularity: 95,
        category: 'Threat Prevention'
    },
    {
        _id: '55974bf73dc107cb75453832',
        name: 'Logging and displaying the entire attack information',
        description: 'Attack type and name, IP addresses, Time, Involved Processes, Action taken by the malware, etc. ',
        topic: 'Threat Prevention Functionality',
        popularity: 90,
        category: 'Threat Prevention'
    },
    {
        _id: '55974bf83dc107cb75453833',
        name: 'Granular policy',
        description: 'Writing specific rules tailored for the organization',
        topic: 'Threat Prevention Functionality',
        popularity: 90,
        category: 'Threat Prevention'
    },
    {
        _id: '55974bf83dc107cb75453834',
        name: 'Forensics',
        description: 'Event investigation and treatment recommendations, incl. identifying other infected server and malware removal',
        topic: 'Threat Prevention Functionality',
        popularity: 45,
        category: 'Threat Prevention'
    },
    {
        _id: '55974bf93dc107cb75453835',
        name: 'Finding the attack in real time',
        description: 'When it happens',
        topic: 'Threat Prevention Functionality',
        popularity: 70,
        category: 'Threat Prevention'
    },
    {
        _id: '55974bf93dc107cb75453836',
        name: 'Integration with Arcsight',
        description: 'Preferred integration is built-in, but local customizations can also be considered',
        topic: 'Threat Prevention Functionality',
        popularity: 85,
        category: 'Threat Prevention'
    },
    {
        _id: '55974bfa3dc107cb75453837',
        name: 'Ease of use and flexibility in creating management reports',
        description: 'Look at pre-canned reports as well as the ability to create your own reports',
        topic: 'Threat Prevention Functionality',
        popularity: 95,
        category: 'Threat Prevention'
    },
    {
        _id: '55974bfa3dc107cb75453838',
        name: 'Incident response service',
        description: 'Is there an incident reposnse service? Does it provide 24x7 support?',
        topic: 'Threat Prevention Functionality',
        popularity: 90,
        category: 'Threat Prevention'
    },
    {
        _id: '55974bfb3dc107cb75453839',
        name: 'On Demand file clearance',
        description: 'A mechanism to manually approve incoming files',
        topic: 'Threat Prevention Functionality',
        popularity: 90,
        category: 'Threat Prevention'
    },
    {
        _id: '55974bfb3dc107cb7545383a',
        name: 'Integration with 3rd party anti virus providers',
        description: 'Like Virus Total and NIST',
        topic: 'Threat Prevention Functionality',
        popularity: 45,
        category: 'Threat Prevention'
    },
    {
        _id: '55974bfc3dc107cb7545383b',
        name: 'SLA',
        description: 'Vendor should commit to respond on real time attacks according to the priority level of the attack',
        topic: 'Threat Prevention Functionality',
        popularity: 70,
        category: 'Threat Prevention'
    },

    {
        _id: '55acc3974c325a20daeac1da',
        name: 'Automatic call distributor',
        description: 'Ability to route incoming calls to the most appropriate agent within a call center',
        topic: 'Contact & Call Center Functionality',
        popularity: 80,
        category: 'Contact & Call Center'
    },
    {
        _id: '55acc3da4c325a20daeac1db',
        name: 'Interactive voice response (IVR)',
        description: 'A telephony menu system that identifies, segments and routes callers',
        topic: 'Contact & Call Center Functionality',
        popularity: 70,
        category: 'Contact & Call Center'
    },
    {
        _id: '55acc4bc4c325a20daeac1dc',
        name: 'Skills-based routing',
        description: 'Ability to send calls to specific agents, departments or teams based on customized rules',
        topic: 'Contact & Call Center Functionality',
        popularity: 50,
        category: 'Contact & Call Center'
    },
    {
        _id: '55acc5204c325a20daeac1dd',
        name: 'Call queues',
        description: 'What is the level of granularity and metrics for managing and balancing call queues?',
        topic: 'Contact & Call Center Functionality',
        popularity: 50,
        category: 'Contact & Call Center'
    },
    {
        _id: '55acc6264c325a20daeac1de',
        name: 'Automatic user-context popup',
        description: 'Showing information about the caller automatically as the phone rings',
        topic: 'Contact & Call Center Functionality',
        popularity: 40,
        category: 'Contact & Call Center'
    },
    {
        _id: '55acc7174c325a20daeac1df',
        name: 'Integrated call control',
        description: 'Enabling basic phone control from within the system (Hold, Mute, Transfer, etc.)',
        topic: 'Contact & Call Center Functionality',
        popularity: 40,
        category: 'Contact & Call Center'
    },
    {
        _id: '55acc8e84c325a20daeac1e0',
        name: 'Call recording',
        description: 'Record and save live calls so they can be replayed at a later time',
        topic: 'Contact & Call Center Functionality',
        popularity: 35,
        category: 'Contact & Call Center'
    },
    {
        _id: '55acc9154c325a20daeac1e1',
        name: 'Call monitoring',
        description: 'Allows managers to listen in on live calls without the agent or caller knowing',
        topic: 'Contact & Call Center Functionality',
        popularity: 35,
        category: 'Contact & Call Center'
    },
    {
        _id: '55acc9634c325a20daeac1e2',
        name: 'Call barging',
        description: 'Allows managers to drop in on live calls to speak with both the agent and the caller',
        topic: 'Contact & Call Center Functionality',
        popularity: 35,
        category: 'Contact & Call Center'
    },
    {
        _id: '55acc9dc4c325a20daeac1e3',
        name: 'Whisper coaching',
        description: 'Allows managers to drop in on a live call to speak with the agent without the caller knowing',
        topic: 'Contact & Call Center Functionality',
        popularity: 35,
        category: 'Contact & Call Center'
    },
    {
        _id: '55accc754c325a20daeac1e6',
        name: 'Callback capability',
        description: 'Allows agent to return a call to missed or interrupted calls',
        topic: 'Contact & Call Center Functionality',
        popularity: 35,
        category: 'Contact & Call Center'
    },
    {
        _id: '55accb534c325a20daeac1e4',
        name: 'Management dashboard',
        description: 'The quality of the dashboard for agents and managers showing real-time metrics, call queue status, etc.',
        topic: 'Contact & Call Center Functionality',
        popularity: 50,
        category: 'Contact & Call Center'
    },
    {
        _id: '55accbca4c325a20daeac1e5',
        name: 'Reporting and Analytics',
        description: 'The historical reports and analytics allowing to analyze and optimize the call center operation',
        topic: 'Contact & Call Center Functionality',
        popularity: 50,
        category: 'Contact & Call Center'
    },

    {
        _id: '55b0f12d749dae4268bbc2d6',
        name: 'Customizable pipeline process',
        description: 'The ability to customize the process to fit the steps and terminology that you use',
        topic: 'Dealflow Management Functionality',
        popularity: 90,
        category: 'Dealflow Management'
    },
    {
        _id: '55b0f19d749dae4268bbc2d7',
        name: 'Pipeline reports',
        description: 'Built-in and customizable reports for monitoring deals in the pipeline',
        topic: 'Dealflow Management Functionality',
        popularity: 90,
        category: 'Dealflow Management'
    },
    {
        _id: '55b0f220749dae4268bbc2d8',
        name: 'Search capabilities',
        description: 'The ability to search using free-text or predefined filters',
        topic: 'Dealflow Management Functionality',
        popularity: 80,
        category: 'Dealflow Management'
    },
    {
        _id: '55b0f246749dae4268bbc2d9',
        name: 'Team collaboration',
        description: 'Allow multiple people to share and collaborate on a deal',
        topic: 'Dealflow Management Functionality',
        popularity: 80,
        category: 'Dealflow Management'
    },
    {
        _id: '55b0f2b6749dae4268bbc2da',
        name: 'Interact via Email',
        description: 'The ability to email notes and files directly into the system',
        topic: 'Dealflow Management Functionality',
        popularity: 70,
        category: 'Dealflow Management'
    },
    {
        _id: '55b0f2c6749dae4268bbc2db',
        name: 'Manage tasks',
        description: 'Enables the team to assign and monitor tasks related to the deal',
        topic: 'Dealflow Management Functionality',
        popularity: 80,
        category: 'Dealflow Management'
    },
    {
        _id: '55b0f2d9749dae4268bbc2dc',
        name: 'Cashflow monitoring',
        description: 'Provides investment summary reports on the deals',
        topic: 'Dealflow Management Functionality',
        popularity: 60,
        category: 'Dealflow Management'
    }
];


module.exports = {
    requirements: requirements
};
