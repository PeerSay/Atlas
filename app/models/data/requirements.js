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
        name: 'Integrator/Reseller Level of expertise on the product',
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
        _id: '55e5844fd7f1b9ff0667b0ea',
        name: 'Overall Support rating',
        description: 'Use this requirement if you want one general rating for support.',
        topic: 'Support & Service',
        popularity: 95
    },
    {
        _id: '55974b373dc107cb75453825',
        name: 'Support Service Level Agreement (SLA)',
        description: 'What is the SLA that this vendor / reseller / integrator offers?',
        topic: 'Support & Service',
        popularity: 60
    },
    {
        _id: '55e58460d7f1b9ff0667b0eb',
        name: 'Support availability',
        description: '24x7, only work-hours, etc.',
        topic: 'Support & Service',
        popularity: 90
    },
    {
        _id: '55e58480d7f1b9ff0667b0ec',
        name: 'Support contact options',
        description: 'What contact methods are available? Email, phone, online chat, etc.',
        topic: 'Support & Service',
        popularity: 90
    },
    {
        _id: '55e58495d7f1b9ff0667b0ed',
        name: 'Local Support partners',
        description: 'Does the vendor have local Support partners for faster response and on-site support?',
        topic: 'Support & Service',
        popularity: 80
    },
    {
        _id: '55e584a6d7f1b9ff0667b0ee',
        name: 'Dedicated account manager',
        description: 'Can you get a dedicated person as a direct point of contact for Support issues?',
        topic: 'Support & Service',
        popularity: 40
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
        description: 'How much does this solution cost?',
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
        description: 'Measuring if the solution will save money beyond its cost, how and when.',
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
        _id: '55e57da8d7f1b9ff0667b0e1',
        name: 'Chargeback Fees',
        description: 'What is the cost of a user performing a chargeback (cancelling a transaction)?',
        topic: 'Cost',
        popularity: 80,
        category: 'Payment Solution'
    },
    {
        _id: '55e430f077549eee97a6b097',
        name: 'Additional Fees',
        description: 'Additional fees that are associated with the solution such as a setup fee, minimal fee, cancellation fee, etc.',
        topic: 'Cost',
        popularity: 70,
        category: 'Payment Solution'
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
    },

    {
        _id: '55cafb2c628e2c1b9abb127c',
        name: 'Inventory Management',
        description: 'Manage all assets - software, hardware, licenses, etc.',
        topic: 'Software Asset Management Functionality',
        popularity: 50,
        category: 'Software Asset Management'
    },
    {
        _id: '55cafb3d628e2c1b9abb127d',
        name: 'Asset Discovery',
        description: 'Is discovery supported and in what method (agent, agent-less, external, etc.',
        topic: 'Software Asset Management Functionality',
        popularity: 50,
        category: 'Software Asset Management'
    },
    {
        _id: '55cafb50628e2c1b9abb127e',
        name: 'Data Integration',
        description: 'Integrate with 3rd party inventory tools and other complementing solutions',
        topic: 'Software Asset Management Functionality',
        popularity: 50,
        category: 'Software Asset Management'
    },
    {
        _id: '55cafb62628e2c1b9abb127f',
        name: 'Software Metering',
        description: 'Measuring and monitoring usage and behavior of software assets',
        topic: 'Software Asset Management Functionality',
        popularity: 50,
        category: 'Software Asset Management'
    },
    {
        _id: '55cafb79628e2c1b9abb1280',
        name: 'Software Utilization Analysis',
        description: 'Analysis of software usage patterns and its implications',
        topic: 'Software Asset Management Functionality',
        popularity: 50,
        category: 'Software Asset Management'
    },
    {
        _id: '55cafb8e628e2c1b9abb1281',
        name: 'Hardware Asset Discovery',
        description: 'Automatiaclly detecting harware assets',
        topic: 'Software Asset Management Functionality',
        popularity: 50,
        category: 'Software Asset Management'
    },
    {
        _id: '55cafb9e628e2c1b9abb1282',
        name: 'Datacenter & Server Management',
        description: 'Managing servers and other datacenter assets',
        topic: 'Software Asset Management Functionality',
        popularity: 50,
        category: 'Software Asset Management'
    },
    {
        _id: '55cafbb4628e2c1b9abb1283',
        name: 'Virtual Environments Management',
        description: 'Ability to manage virtual assets (e.g. VMWare, Citrix, etc.)',
        topic: 'Software Asset Management Functionality',
        popularity: 50,
        category: 'Software Asset Management'
    },
    {
        _id: '55cafbc7628e2c1b9abb1284',
        name: 'Web Application Metering',
        description: 'Ability to monitor and measure web application usage',
        topic: 'Software Asset Management Functionality',
        popularity: 50,
        category: 'Software Asset Management'
    },
    {
        _id: '55cafbde628e2c1b9abb1285',
        name: 'Cloud Application Metering',
        description: 'Ability to monitor and measure cloud application usage',
        topic: 'Software Asset Management Functionality',
        popularity: 50,
        category: 'Software Asset Management'
    },
    {
        _id: '55cafbee628e2c1b9abb1286',
        name: 'Mobile Application Management',
        description: 'Manage mobile apps',
        topic: 'Software Asset Management Functionality',
        popularity: 50,
        category: 'Software Asset Management'
    },
    {
        _id: '55cafc04628e2c1b9abb1287',
        name: 'Hardware Asset Management',
        description: 'Ability to manage hardware assets',
        topic: 'Software Asset Management Functionality',
        popularity: 50,
        category: 'Software Asset Management'
    },
    {
        _id: '55cafc15628e2c1b9abb1288',
        name: 'Contracts Management',
        description: 'Manage contracts related to managed assets to control coverage, renewals, etc.',
        topic: 'Software Asset Management Functionality',
        popularity: 50,
        category: 'Software Asset Management'
    },
    {
        _id: '55cafc27628e2c1b9abb1289',
        name: 'Intelligent Software Reconciliation',
        description: 'Compare purchased licenses and entitlement with actual usage',
        topic: 'Software Asset Management Functionality',
        popularity: 50,
        category: 'Software Asset Management'
    },
    {
        _id: '55cafc37628e2c1b9abb128a',
        name: 'Advanced License Management',
        description: 'Ability to manage specific licenses and idenitfy overlaps, gaps and optimizations',
        topic: 'Software Asset Management Functionality',
        popularity: 50,
        category: 'Software Asset Management'
    },

    {
        _id: '55e433cb77549eee97a6b099',
        name: 'Transaction completion time',
        description: 'The time until the tranaction settlment is complete and you get the money into your merchant account',
        topic: 'Payment Solution Functionality',
        popularity: 60,
        category: 'Payment Solution'
    },
    {
        _id: '55e433e077549eee97a6b09a',
        name: 'Recurring payment support',
        description: 'Does the solution support a built-in capability for recurring charges. This can save you the need to store credit card details of users.',
        topic: 'Payment Solution Functionality',
        popularity: 90,
        category: 'Payment Solution'
    },
    {
        _id: '55e433f177549eee97a6b09b',
        name: 'Merchant Account options',
        description: 'Can you get an account from the provider, do you need to open a dedicated account with your bank or another processor, etc.',
        topic: 'Payment Solution Functionality',
        popularity: 80,
        category: 'Payment Solution'
    },
    {
        _id: '55e57df0d7f1b9ff0667b0e2',
        name: 'Support for \"Doing Business As...\"',
        description: 'Enables controlling the name that will appear on transaction reports to help users identify charges more easily',
        topic: 'Payment Solution Functionality',
        popularity: 60,
        category: 'Payment Solution'
    },
    {
        _id: '55e57e05d7f1b9ff0667b0e3',
        name: 'Provider familiarity with target market',
        description: 'A vendor familiar with the user profiles and behavior in a certain region is less likely to reject legitimate transactions as suspicious',
        topic: 'Payment Solution Functionality',
        popularity: 90,
        category: 'Payment Solution'
    },
    {
        _id: '55e57e29d7f1b9ff0667b0e4',
        name: 'Smart payment routing',
        description: 'Support for using multiple payment processors and choosing the most suitable per transaction',
        topic: 'Payment Solution Functionality',
        popularity: 80,
        category: 'Payment Solution'
    },
    {
        _id: '55e57e3fd7f1b9ff0667b0e5',
        name: 'PCI certifiation',
        description: 'Does the solution have a PCI (Payment Card Industry) certification',
        topic: 'Payment Solution Functionality',
        popularity: 90,
        category: 'Payment Solution'
    },
    {
        _id: '55e57e57d7f1b9ff0667b0e6',
        name: 'Application Interface',
        description: 'How the solution integrates into your application or web site (embedded in the page, redirect to the provider page etc.)',
        topic: 'Payment Solution Functionality',
        popularity: 90,
        category: 'Payment Solution'
    },
    {
        _id: '55e57e6cd7f1b9ff0667b0e7',
        name: 'Data Portability',
        description: 'The ability to export past transactions and recurring payments in case you wanty to transfer to a different provider',
        topic: 'Payment Solution Functionality',
        popularity: 50,
        category: 'Payment Solution'
    },
    {
        _id: '55e57e86d7f1b9ff0667b0e8',
        name: 'Escalation & Dispute Process',
        description: 'How are rejected transactions disputed: Can you argue against unjust chargebacks? What information will you need to disclose about customers? etc.',
        topic: 'Payment Solution Functionality',
        popularity: 60,
        category: 'Payment Solution'
    }
];


module.exports = {
    requirements: requirements
};
