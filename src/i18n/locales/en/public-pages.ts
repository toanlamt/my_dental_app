const publicPages = {
  breadcrumbs: { home: "Home", services: "Services", doctors: "Doctors" },
  common: {
    notFoundTitle: "We could not find that page",
    notFoundDescription:
      "The information you requested is not available. Please return to the public home page.",
    backHome: "Back to home",
    explore: "Explore",
    book: "Book an appointment",
    areas: "Areas of practice",
    expect: "What to expect",
  },
  services: {
    title: "Services for every stage of your smile",
    intro:
      "Clear, thoughtful dental care for everyday needs and long-term wellbeing.",
    detailIntro:
      "A considered approach to care, shaped around your questions, comfort, and goals.",
    benefits: "Benefits of this service",
    items: {
      "general-dentistry": {
        title: "General dentistry",
        short: "Everyday care to help keep your smile healthy.",
        detail:
          "Routine examinations and restorative care help you understand your oral health and make informed next steps.",
        benefits: [
          "Regular preventive care",
          "Clear explanations at every visit",
          "A plan that reflects your needs",
        ],
      },
      "dental-cleaning": {
        title: "Dental cleaning",
        short: "A fresh, comfortable reset for your oral health.",
        detail:
          "Professional cleaning supports the daily habits that keep teeth and gums feeling fresh and cared for.",
        benefits: [
          "A cleaner, fresher feel",
          "Support for healthy gums",
          "Practical home-care guidance",
        ],
      },
      "teeth-whitening": {
        title: "Teeth whitening",
        short: "A brighter smile with a plan made for you.",
        detail:
          "Explore whitening options with guidance on what may suit your smile, preferences, and starting point.",
        benefits: [
          "A personalized conversation",
          "Clear care instructions",
          "Comfort-focused planning",
        ],
      },
      "dental-implants": {
        title: "Dental implants",
        short: "Explore restorative options with thoughtful guidance.",
        detail:
          "Implant consultations begin with listening, assessment, and a clear explanation of restorative possibilities.",
        benefits: [
          "A careful assessment",
          "Restorative options explained",
          "Time to make an informed decision",
        ],
      },
      orthodontics: {
        title: "Orthodontics",
        short: "Guidance for a more aligned, confident smile.",
        detail:
          "Orthodontic consultations help you understand alignment options and what a potential care journey may involve.",
        benefits: [
          "A clear starting assessment",
          "Options explained simply",
          "Progress shaped around your goals",
        ],
      },
      "childrens-dentistry": {
        title: "Children's dentistry",
        short: "Gentle visits that help young smiles grow well.",
        detail:
          "A calm, age-appropriate approach helps children build positive routines around dental care.",
        benefits: [
          "A welcoming first experience",
          "Simple, reassuring explanations",
          "Caregivers included in the conversation",
        ],
      },
    },
  },
  about: {
    eyebrow: "About the clinic",
    title: "A calmer way to care for your smile",
    intro:
      "Thịnh Hưng Dental is a professional placeholder clinic concept built around clear communication, thoughtful visits, and respect for each patient.",
    missionTitle: "Our mission",
    mission:
      "To make dental care easier to understand and more comfortable to approach, one conversation at a time.",
    valuesTitle: "Our values",
    values: [
      {
        title: "Listen first",
        text: "We make room for questions, context, and individual priorities.",
      },
      {
        title: "Be clear",
        text: "We explain options in plain language so decisions feel informed.",
      },
      {
        title: "Care thoughtfully",
        text: "We design each visit around dignity, comfort, and continuity.",
      },
    ],
    environmentTitle: "A welcoming environment",
    environment:
      "Our placeholder clinic environment is imagined as bright, calm, and practical, with spaces designed to help patients feel at ease from arrival to follow-up.",
    cta: "Start a conversation",
  },
  doctors: {
    title: "Meet the care team",
    intro:
      "Get to know the people who make each visit considered and personal.",
    practice: "Areas of practice",
    items: {
      "ngoc-hieu": {
        name: "Dr. Alex Morgan",
        specialty: "General dentistry",
        bio: "Alex takes a thoughtful, conversational approach to everyday dental care and patient education.",
        areas: [
          "Preventive care",
          "Restorative consultations",
          "Patient education",
        ],
      },
      "jordan-lee": {
        name: "Dr. Jordan Lee",
        specialty: "Orthodontics",
        bio: "Jordan helps patients explore alignment care with clear expectations and an emphasis on feeling comfortable.",
        areas: [
          "Orthodontic consultations",
          "Alignment planning",
          "Family care",
        ],
      },
      "sam-taylor": {
        name: "Dr. Sam Taylor",
        specialty: "Children's dentistry",
        bio: "Sam focuses on creating positive, age-appropriate experiences that help young patients feel confident about dental visits.",
        areas: [
          "Children’s visits",
          "Preventive guidance",
          "Family conversations",
        ],
      },
    },
  },
  faq: {
    title: "Questions, answered clearly",
    intro:
      "General guidance to help you feel prepared. Details can be discussed with the clinic team.",
    items: {
      booking: [
        "How can I book an appointment?",
        "Use the booking button to begin an appointment request. The booking workflow will be added in a future phase.",
      ],
      checkups: [
        "How often should I have a routine checkup?",
        "A dental professional can suggest a schedule based on your needs and history.",
      ],
      cleaning: [
        "What happens during a dental cleaning?",
        "A professional cleaning generally includes an oral-health review and careful removal of buildup.",
      ],
      whitening: [
        "Is teeth whitening right for me?",
        "A consultation can help you understand available options and whether whitening suits your smile.",
      ],
      braces: [
        "How do I learn about braces?",
        "An orthodontic consultation is a useful first step for discussing alignment and treatment options.",
      ],
      children: [
        "When should children start dental visits?",
        "Families can ask a dental professional for age-appropriate guidance and a comfortable introduction to care.",
      ],
      implants: [
        "What should I know about dental implants?",
        "An assessment is needed to discuss suitability, restorative choices, and the steps involved.",
      ],
      duration: [
        "How long does an appointment take?",
        "Visit length varies by the type of appointment and the care being provided.",
      ],
      bring: [
        "What should I bring to an appointment?",
        "Bring any questions, relevant health information, and details of medicines you take.",
      ],
      emergency: [
        "Can I ask about an urgent dental problem?",
        "Contact the clinic as soon as possible so the team can advise on the next appropriate step.",
      ],
    },
  },
  contact: {
    title: "Let’s stay in touch",
    intro: "Find the clinic, reach the team, or begin planning a visit.",
    clinic: "Thịnh Hưng Dental",
    addressLabel: "Address",
    address: "918 Âu Cơ, Tân Bình, Thành phố Hồ Chí Minh, Việt Nam",
    phoneLabel: "Phone",
    phone: "+84 909 599 005",
    emailLabel: "Email",
    email: "nhakhoathinhhung@gmail.com",
    hoursLabel: "Opening hours",
    hours: "Mon–Sun, 8:00–20:30",
    mapTitle: "Clinic location",
    mapText:
      "Map placeholder. A location link can be added when the clinic address is confirmed.",
    mapLink: "Open map placeholder",
  },
  meta: {
    services: "Dental services | Thịnh Hưng Dental",
    about: "About the clinic | Thịnh Hưng Dental",
    doctors: "Our doctors | Thịnh Hưng Dental",
    faq: "Dental questions | Thịnh Hưng Dental",
    contact: "Contact the clinic | Thịnh Hưng Dental",
    description:
      "Thoughtful dental care and clear information from Thịnh Hưng Dental.",
  },
};
export default publicPages;
