export type CuratedDistractorEntry = {
  question: string
  answerType: string
  correctAnswers: readonly string[]
  curatedDistractors: readonly string[]
  rationale: string
}

export type CuratedDistractorDatabase = {
  readonly [questionNumber: string]: CuratedDistractorEntry
}

export const CuratedDistractorDatabase: CuratedDistractorDatabase = {
  // PRINCIPLES OF AMERICAN DEMOCRACY (Questions 1-12)
  '1': {
    question: 'What is the supreme law of the land?',
    answerType: 'document',
    correctAnswers: ['the Constitution'],
    curatedDistractors: [
      'the Declaration of Independence',
      'the Bill of Rights',
      'the Articles of Confederation',
      'the Federalist Papers'
    ],
    rationale: 'Other foundational American documents'
  },
  '2': {
    question: 'What does the Constitution do?',
    answerType: 'concept',
    correctAnswers: [
      'sets up the government',
      'defines the government',
      'protects basic rights of Americans'
    ],
    curatedDistractors: [
      'declares independence from Britain',
      'establishes religious freedom',
      'creates the military',
      'establishes the economy'
    ],
    rationale: 'Other major governmental functions'
  },
  '3': {
    question:
      'The idea of self-government is in the first three words of the Constitution. What are these words?',
    answerType: 'phrase',
    correctAnswers: ['We the People'],
    curatedDistractors: [
      'Life, Liberty and the pursuit of Happiness',
      'All men are created equal',
      'In order to form a more perfect Union',
      'We hold these truths'
    ],
    rationale: 'Other famous opening phrases from American founding documents'
  },
  '4': {
    question: 'What is an amendment?',
    answerType: 'concept',
    correctAnswers: ['a change (to the Constitution)', 'an addition (to the Constitution)'],
    curatedDistractors: [
      'a law (passed by Congress)',
      'a decision (by the courts)',
      'an order (from the President)',
      'a regulation (by states)'
    ],
    rationale: 'Other types of legal/governmental actions'
  },
  '5': {
    question: 'What do we call the first ten amendments to the Constitution?',
    answerType: 'document',
    correctAnswers: ['the Bill of Rights'],
    curatedDistractors: [
      'the Declaration of Independence',
      'the Articles of Confederation',
      'the Federalist Papers',
      'the Constitution'
    ],
    rationale: 'Other important American documents'
  },
  '6': {
    question: 'What is one right or freedom from the First Amendment?',
    answerType: 'rights',
    correctAnswers: ['speech', 'religion', 'assembly', 'press', 'petition the government'],
    curatedDistractors: ['bear arms', 'vote', 'trial by jury', 'due process'],
    rationale: 'Other constitutional rights from different amendments'
  },
  '7': {
    question: 'How many amendments does the Constitution have?',
    answerType: 'number',
    correctAnswers: ['twenty-seven (27)'],
    curatedDistractors: ['ten (10)', 'thirteen (13)', 'twenty-six (26)', 'fifty (50)'],
    rationale: 'Other significant numbers in American government'
  },
  '8': {
    question: 'What did the Declaration of Independence do?',
    answerType: 'concept',
    correctAnswers: [
      'announced our independence (from Great Britain)',
      'declared our independence (from Great Britain)',
      'said that the United States is free (from Great Britain)'
    ],
    curatedDistractors: [
      'established the Constitution',
      'created the Bill of Rights',
      'formed the first government',
      'established religious freedom'
    ],
    rationale: 'Other major governmental/founding actions'
  },
  '9': {
    question: 'What are two rights in the Declaration of Independence?',
    answerType: 'rights',
    correctAnswers: ['life', 'liberty', 'pursuit of happiness'],
    curatedDistractors: [
      'freedom of speech',
      'freedom of religion',
      'right to bear arms',
      'right to vote'
    ],
    rationale: 'Other fundamental rights that could be confused with natural rights'
  },
  '10': {
    question: 'What is freedom of religion?',
    answerType: 'concept',
    correctAnswers: ['You can practice any religion, or not practice a religion.'],
    curatedDistractors: [
      'You can say anything you want',
      'You can assemble peacefully',
      'You can petition the government',
      'You can practice your own beliefs'
    ],
    rationale: 'Other First Amendment freedoms and related concepts'
  },
  '11': {
    question: 'What is the economic system in the United States?',
    answerType: 'economic',
    correctAnswers: ['capitalist economy', 'market economy'],
    curatedDistractors: [
      'socialist economy',
      'communist economy',
      'mixed economy',
      'command economy'
    ],
    rationale: 'Other economic systems'
  },
  '12': {
    question: 'What is the "rule of law"?',
    answerType: 'concept',
    correctAnswers: [
      'Everyone must follow the law.',
      'Leaders must obey the law.',
      'Government must obey the law.',
      'No one is above the law.'
    ],
    curatedDistractors: [
      'separation of powers',
      'checks and balances',
      'due process of law',
      'equal protection under the law'
    ],
    rationale: 'Other fundamental democratic principles'
  },

  // SYSTEM OF GOVERNMENT (Questions 13-47)
  '13': {
    question: 'Name one branch or part of the government.',
    answerType: 'government',
    correctAnswers: ['Congress', 'legislative', 'President', 'executive', 'the courts', 'judicial'],
    curatedDistractors: [
      'the Cabinet',
      'the Senate',
      'the House of Representatives',
      'the Supreme Court'
    ],
    rationale: 'Other government bodies that could be confused with the three branches'
  },
  '14': {
    question: 'What stops one branch of government from becoming too powerful?',
    answerType: 'concept',
    correctAnswers: ['checks and balances', 'separation of powers'],
    curatedDistractors: ['rule of law', 'federalism', 'judicial review', 'due process'],
    rationale: 'Other constitutional principles'
  },
  '15': {
    question: 'Who is in charge of the executive branch?',
    answerType: 'government',
    correctAnswers: ['the President'],
    curatedDistractors: [
      'the Vice President',
      'the Speaker of the House',
      'the Chief Justice',
      'the Secretary of State'
    ],
    rationale: 'Other high-ranking government officials'
  },
  '16': {
    question: 'Who makes federal laws?',
    answerType: 'government',
    correctAnswers: [
      'Congress',
      'Senate and House (of Representatives)',
      '(U.S. or national) legislature'
    ],
    curatedDistractors: ['the President', 'the Supreme Court', 'the Cabinet', 'state governments'],
    rationale: 'Other government bodies that could be confused with legislative power'
  },
  '17': {
    question: 'What are the two parts of the U.S. Congress?',
    answerType: 'government',
    correctAnswers: ['the Senate and House (of Representatives)'],
    curatedDistractors: [
      'the House and the Cabinet',
      'the Senate and the Supreme Court',
      'the Upper House and Lower House',
      'the Congress and the Legislature'
    ],
    rationale: 'Other government body combinations'
  },
  '18': {
    question: 'How many U.S. Senators are there?',
    answerType: 'number',
    correctAnswers: ['one hundred (100)'],
    curatedDistractors: [
      'fifty (50)',
      'four hundred thirty-five (435)',
      'two hundred (200)',
      'ninety-six (96)'
    ],
    rationale: 'Other significant numbers in American government'
  },
  '19': {
    question: 'We elect a U.S. Senator for how many years?',
    answerType: 'number',
    correctAnswers: ['six (6)'],
    curatedDistractors: ['two (2)', 'four (4)', 'eight (8)', 'ten (10)'],
    rationale: 'Other term lengths in American government'
  },
  '20': {
    question: "Who is one of your state's U.S. Senators now?",
    answerType: 'person',
    correctAnswers: ['Answers will vary by state'],
    curatedDistractors: [
      'Joe Biden',
      'Nancy Pelosi',
      'Kevin McCarthy',
      'Alexandria Ocasio-Cortez',
      'Mitch McConnell',
      'Chuck Schumer'
    ],
    rationale: 'Famous politicians who are not currently senators'
  },
  '21': {
    question: 'The House of Representatives has how many voting members?',
    answerType: 'number',
    correctAnswers: ['four hundred thirty-five (435)'],
    curatedDistractors: [
      'one hundred (100)',
      'four hundred (400)',
      'five hundred (500)',
      'four hundred fifty (450)'
    ],
    rationale: 'Other significant numbers in American government'
  },
  '22': {
    question: 'We elect a U.S. Representative for how many years?',
    answerType: 'number',
    correctAnswers: ['two (2)'],
    curatedDistractors: ['four (4)', 'six (6)', 'three (3)', 'one (1)'],
    rationale: 'Other term lengths in American government'
  },
  '23': {
    question: 'Name your U.S. Representative.',
    answerType: 'person-current',
    correctAnswers: ['Answers will vary based on location'],
    curatedDistractors: ['Nancy Pelosi', 'Chuck Schumer', 'Mitch McConnell', 'Kevin McCarthy'],
    rationale: 'Other prominent congressional leaders'
  },
  '24': {
    question: 'Who does a U.S. Senator represent?',
    answerType: 'concept',
    correctAnswers: ['all people of the state'],
    curatedDistractors: [
      'people in their district',
      'people who voted for them',
      'their political party',
      'the federal government'
    ],
    rationale: 'Other constituencies that could be confused with statewide representation'
  },
  '25': {
    question: 'Why do some states have more Representatives than other states?',
    answerType: 'concept',
    correctAnswers: [
      "(because of) the state's population",
      '(because) they have more people',
      '(because) some states have more people'
    ],
    curatedDistractors: [
      "because of the state's size",
      "because of the state's wealth",
      'because of when they joined the Union',
      'because of their electoral votes'
    ],
    rationale: 'Other state characteristics that could be confused with population'
  },
  '26': {
    question: 'We elect a President for how many years?',
    answerType: 'number',
    correctAnswers: ['four (4)'],
    curatedDistractors: ['two (2)', 'six (6)', 'eight (8)', 'five (5)'],
    rationale: 'Other term lengths in American government'
  },
  '27': {
    question: 'In what month do we vote for President?',
    answerType: 'date',
    correctAnswers: ['November'],
    curatedDistractors: ['October', 'December', 'September', 'January'],
    rationale: 'Other months near the election period'
  },
  '28': {
    question: 'What is the name of the President of the United States now?',
    answerType: 'person-current',
    correctAnswers: ['Donald J. Trump', 'Donald Trump', 'Trump'],
    curatedDistractors: ['Joe Biden', 'Barack Obama', 'George W. Bush', 'Bill Clinton'],
    rationale: 'Recent former presidents'
  },
  '29': {
    question: 'What is the name of the Vice President of the United States now?',
    answerType: 'person-current',
    correctAnswers: ['J.D. Vance', 'JD Vance', 'Vance'],
    curatedDistractors: ['Kamala Harris', 'Mike Pence', 'Joe Biden', 'Tim Walz'],
    rationale: 'Recent vice presidents and prominent political figures'
  },
  '30': {
    question: 'If the President can no longer serve, who becomes President?',
    answerType: 'government',
    correctAnswers: ['the Vice President'],
    curatedDistractors: [
      'the Speaker of the House',
      'the Chief Justice',
      'the Secretary of State',
      'the Senate Majority Leader'
    ],
    rationale: 'Other high-ranking government officials in the line of succession'
  },
  '31': {
    question:
      'If both the President and the Vice President can no longer serve, who becomes President?',
    answerType: 'government',
    correctAnswers: ['the Speaker of the House'],
    curatedDistractors: [
      'the Chief Justice',
      'the Secretary of State',
      'the Senate Majority Leader',
      'the Attorney General'
    ],
    rationale: 'Other high-ranking government officials in the line of succession'
  },
  '32': {
    question: 'Who is the Commander in Chief of the military?',
    answerType: 'government',
    correctAnswers: ['the President'],
    curatedDistractors: [
      'the Secretary of Defense',
      'the Chairman of the Joint Chiefs',
      'the Vice President',
      'the Chief of Staff'
    ],
    rationale: 'Other high-ranking military and government officials'
  },
  '33': {
    question: 'Who signs bills to become laws?',
    answerType: 'government',
    correctAnswers: ['the President'],
    curatedDistractors: [
      'the Vice President',
      'the Speaker of the House',
      'the Chief Justice',
      'the Attorney General'
    ],
    rationale: 'Other government officials who could be confused with legislative role'
  },
  '34': {
    question: 'Who vetoes bills?',
    answerType: 'government',
    correctAnswers: ['the President'],
    curatedDistractors: [
      'the Vice President',
      'the Supreme Court',
      'the Speaker of the House',
      'the Senate Majority Leader'
    ],
    rationale: 'Other government officials or bodies who could be confused with veto power'
  },
  '35': {
    question: "What does the President's Cabinet do?",
    answerType: 'concept',
    correctAnswers: ['advises the President'],
    curatedDistractors: ['makes laws', 'interprets laws', 'enforces laws', 'votes on bills'],
    rationale: 'Other government functions that could be confused with advisory role'
  },
  '36': {
    question: 'What are two Cabinet-level positions?',
    answerType: 'government',
    correctAnswers: [
      'Secretary of Agriculture',
      'Secretary of Commerce',
      'Secretary of Defense',
      'Secretary of Education',
      'Secretary of Energy',
      'Secretary of Health and Human Services',
      'Secretary of Homeland Security',
      'Secretary of Housing and Urban Development',
      'Secretary of the Interior',
      'Secretary of Labor',
      'Secretary of State',
      'Secretary of Transportation',
      'Secretary of the Treasury',
      'Secretary of Veterans Affairs',
      'Attorney General',
      'Vice President'
    ],
    curatedDistractors: [
      'Speaker of the House',
      'Chief Justice',
      'Senate Majority Leader',
      'Director of the FBI'
    ],
    rationale:
      'Other high-ranking government positions that could be confused with Cabinet positions'
  },
  '37': {
    question: 'What does the judicial branch do?',
    answerType: 'concept',
    correctAnswers: [
      'reviews laws',
      'explains laws',
      'resolves disputes (disagreements)',
      'decides if a law goes against the Constitution'
    ],
    curatedDistractors: ['makes laws', 'enforces laws', 'signs bills into law', 'vetoes bills'],
    rationale: 'Other government functions that could be confused with judicial branch role'
  },
  '38': {
    question: 'What is the highest court in the United States?',
    answerType: 'government',
    correctAnswers: ['the Supreme Court'],
    curatedDistractors: [
      'the Federal Court',
      'the Appeals Court',
      'the District Court',
      'the Constitutional Court'
    ],
    rationale: 'Other types of courts that could be confused with the Supreme Court'
  },
  '39': {
    question: 'How many justices are on the Supreme Court?',
    answerType: 'number',
    correctAnswers: ['nine (9)'],
    curatedDistractors: ['seven (7)', 'eleven (11)', 'twelve (12)', 'five (5)'],
    rationale: 'Other plausible numbers for a high court'
  },
  '40': {
    question: 'Who is the Chief Justice of the United States now?',
    answerType: 'person-current',
    correctAnswers: ['John Roberts', 'John G. Roberts, Jr.', 'Roberts'],
    curatedDistractors: ['Clarence Thomas', 'Samuel Alito', 'Sonia Sotomayor', 'Elena Kagan'],
    rationale: 'Other current Supreme Court justices'
  },
  '41': {
    question:
      'Under our Constitution, some powers belong to the federal government. What is one power of the federal government?',
    answerType: 'government',
    correctAnswers: ['to print money', 'to declare war', 'to create an army', 'to make treaties'],
    curatedDistractors: [
      'to provide education',
      "to issue driver's licenses",
      'to regulate marriage',
      'to establish local governments'
    ],
    rationale: 'State and local government powers that could be confused with federal powers'
  },
  '42': {
    question:
      'Under our Constitution, some powers belong to the states. What is one power of the states?',
    answerType: 'government',
    correctAnswers: [
      'provide schooling and education',
      'provide protection (police)',
      'provide safety (fire departments)',
      "give a driver's license",
      'approve zoning and land use'
    ],
    curatedDistractors: [
      'print money',
      'declare war',
      'make treaties',
      'regulate interstate commerce'
    ],
    rationale: 'Federal government powers that could be confused with state powers'
  },
  '43': {
    question: 'Who is the Governor of your state now?',
    answerType: 'person-current',
    correctAnswers: ['Answers will vary based on location'],
    curatedDistractors: ['Gavin Newsom', 'Ron DeSantis', 'Greg Abbott', 'Kathy Hochul'],
    rationale: 'Other prominent current governors'
  },
  '44': {
    question: 'What is the capital of your state?',
    answerType: 'geography',
    correctAnswers: ['Answers will vary based on location'],
    curatedDistractors: ['Washington, D.C.', 'New York City', 'Los Angeles', 'Chicago'],
    rationale: 'Other major cities that could be confused with state capitals'
  },
  '45': {
    question: 'What are the two major political parties in the United States?',
    answerType: 'concept',
    correctAnswers: ['Democratic and Republican'],
    curatedDistractors: [
      'Liberal and Conservative',
      'Federalist and Anti-Federalist',
      'Whig and Democratic',
      'Progressive and Traditional'
    ],
    rationale: 'Other political party combinations from American history'
  },
  '46': {
    question: 'What is the political party of the President now?',
    answerType: 'concept',
    correctAnswers: ['Republican'],
    curatedDistractors: ['Democratic', 'Independent', 'Libertarian', 'Green'],
    rationale: 'Other major political parties'
  },
  '47': {
    question: 'What is the name of the Speaker of the House of Representatives now?',
    answerType: 'person-current',
    correctAnswers: ['Mike Johnson'],
    curatedDistractors: ['Nancy Pelosi', 'Kevin McCarthy', 'Paul Ryan', 'John Boehner'],
    rationale: 'Other recent Speakers of the House'
  },

  // RULE OF LAW (Questions 48-57)
  '48': {
    question:
      'There are four amendments to the Constitution about who can vote. Describe one of them.',
    answerType: 'concept',
    correctAnswers: [
      'Citizens eighteen (18) and older (can vote)',
      "You don't have to pay (a poll tax) to vote",
      'Any citizen can vote. (Women and men can vote.)',
      'A male citizen of any race (can vote)'
    ],
    curatedDistractors: [
      'You must own property to vote',
      'You must pass a literacy test to vote',
      'You must be born in the United States to vote',
      'You must be married to vote'
    ],
    rationale: 'Historical voting restrictions that were eliminated by amendments'
  },
  '49': {
    question: 'What is one responsibility that is only for United States citizens?',
    answerType: 'concept',
    correctAnswers: ['serve on a jury', 'vote in a federal election'],
    curatedDistractors: ['pay taxes', 'obey the law', 'defend the country', 'respect the flag'],
    rationale: 'Responsibilities that apply to all residents, not just citizens'
  },
  '50': {
    question: 'Name one right only for United States citizens.',
    answerType: 'rights',
    correctAnswers: ['vote in a federal election', 'run for federal office'],
    curatedDistractors: [
      'freedom of speech',
      'freedom of religion',
      'right to a fair trial',
      'right to petition the government'
    ],
    rationale: 'Rights that apply to all people in the US, not just citizens'
  },
  '51': {
    question: 'What are two rights of everyone living in the United States?',
    answerType: 'rights',
    correctAnswers: [
      'freedom of expression',
      'freedom of speech',
      'freedom of assembly',
      'freedom to petition the government',
      'freedom of religion',
      'the right to bear arms'
    ],
    curatedDistractors: [
      'right to vote',
      'right to run for office',
      'right to serve on a jury',
      'right to government benefits'
    ],
    rationale: 'Rights that are limited to citizens only'
  },
  '52': {
    question: 'What do we show loyalty to when we say the Pledge of Allegiance?',
    answerType: 'concept',
    correctAnswers: ['the United States', 'the flag'],
    curatedDistractors: ['the President', 'the Constitution', 'the military', 'the government'],
    rationale: 'Other entities that could be confused with the object of the Pledge'
  },
  '53': {
    question: 'What is one promise you make when you become a United States citizen?',
    answerType: 'concept',
    correctAnswers: [
      'give up loyalty to other countries',
      'defend the Constitution and laws of the United States',
      'obey the laws of the United States',
      'serve in the U.S. military (if needed)',
      'serve (do important work for) the nation (if needed)',
      'be loyal to the United States'
    ],
    curatedDistractors: [
      'learn to speak English perfectly',
      'pay higher taxes',
      'vote in every election',
      'serve on a jury every year'
    ],
    rationale: 'Requirements that are not part of the citizenship oath'
  },
  '54': {
    question: 'How old do citizens have to be to vote for President?',
    answerType: 'number',
    correctAnswers: ['eighteen (18) and older'],
    curatedDistractors: [
      'sixteen (16) and older',
      'twenty-one (21) and older',
      'twenty-five (25) and older',
      'thirty (30) and older'
    ],
    rationale: 'Other age requirements that could be confused with voting age'
  },
  '55': {
    question: 'What are two ways that Americans can participate in their democracy?',
    answerType: 'concept',
    correctAnswers: [
      'vote',
      'join a political party',
      'help with a campaign',
      'join a civic group',
      'join a community group',
      'give an elected official your opinion on an issue',
      'call Senators and Representatives',
      'publicly support or oppose an issue or policy',
      'run for office',
      'write to a newspaper'
    ],
    curatedDistractors: ['pay taxes', 'obey all laws', 'respect the flag', 'defend the country'],
    rationale: 'Civic duties that are not forms of democratic participation'
  },
  '56': {
    question: 'When is the last day you can send in federal income tax forms?',
    answerType: 'date',
    correctAnswers: ['April 15'],
    curatedDistractors: ['December 31', 'January 31', 'March 15', 'June 15'],
    rationale: 'Other dates that could be confused with tax deadline'
  },
  '57': {
    question: 'When must all men register for the Selective Service?',
    answerType: 'concept',
    correctAnswers: ['at age eighteen (18)', 'between eighteen (18) and twenty-six (26)'],
    curatedDistractors: [
      'at age sixteen (16)',
      'at age twenty-one (21)',
      'when they graduate high school',
      'when they become citizens'
    ],
    rationale: 'Other age milestones that could be confused with Selective Service registration'
  },

  // AMERICAN HISTORY (Questions 58-87)
  '58': {
    question: 'What is one reason colonists came to America?',
    answerType: 'history',
    correctAnswers: [
      'freedom',
      'political liberty',
      'religious freedom',
      'economic opportunity',
      'practice their religion',
      'escape persecution'
    ],
    curatedDistractors: [
      'to find gold',
      'to conquer new lands',
      'to spread Christianity',
      'to establish slavery'
    ],
    rationale: 'Other historical motivations that were not primary reasons for colonization'
  },
  '59': {
    question: 'Who lived in America before the Europeans arrived?',
    answerType: 'history',
    correctAnswers: ['American Indians', 'Native Americans'],
    curatedDistractors: [
      'Spanish explorers',
      'French traders',
      'Viking settlers',
      'Portuguese fishermen'
    ],
    rationale: 'Other groups that arrived in America but after the indigenous peoples'
  },
  '60': {
    question: 'What group of people was taken to America and sold as slaves?',
    answerType: 'history',
    correctAnswers: ['Africans', 'people from Africa'],
    curatedDistractors: [
      'Native Americans',
      'Irish immigrants',
      'Chinese workers',
      'European prisoners'
    ],
    rationale:
      'Other groups who faced hardship in America but were not the primary enslaved population'
  },
  '61': {
    question: 'Why did the colonists fight the British?',
    answerType: 'history',
    correctAnswers: [
      'because of high taxes (taxation without representation)',
      'because the British army stayed in their houses (boarding, quartering)',
      "because they didn't have self-government"
    ],
    curatedDistractors: [
      'because of religious differences',
      'because of territorial disputes',
      'because of trade competition',
      'because of cultural conflicts'
    ],
    rationale: 'Other types of conflicts that were not the main reasons for the American Revolution'
  },
  '62': {
    question: 'Who wrote the Declaration of Independence?',
    answerType: 'person-historical',
    correctAnswers: ['(Thomas) Jefferson'],
    curatedDistractors: [
      'George Washington',
      'Benjamin Franklin',
      'John Adams',
      'Alexander Hamilton'
    ],
    rationale: 'Other Founding Fathers who could be confused with Jefferson'
  },
  '63': {
    question: 'When was the Declaration of Independence adopted?',
    answerType: 'date',
    correctAnswers: ['July 4, 1776'],
    curatedDistractors: ['July 4, 1775', 'July 4, 1777', 'September 17, 1787', 'December 15, 1791'],
    rationale: 'Other important dates in American history'
  },
  '64': {
    question: 'There were 13 original states. Name three.',
    answerType: 'geography',
    correctAnswers: [
      'New Hampshire',
      'Massachusetts',
      'Rhode Island',
      'Connecticut',
      'New York',
      'New Jersey',
      'Pennsylvania',
      'Delaware',
      'Maryland',
      'Virginia',
      'North Carolina',
      'South Carolina',
      'Georgia'
    ],
    curatedDistractors: ['Vermont', 'Kentucky', 'Tennessee', 'Ohio'],
    rationale: 'States that were admitted to the Union shortly after independence'
  },
  '65': {
    question: 'What happened at the Constitutional Convention?',
    answerType: 'history',
    correctAnswers: ['The Constitution was written', 'The Founding Fathers wrote the Constitution'],
    curatedDistractors: [
      'The Declaration of Independence was signed',
      'The Bill of Rights was created',
      'The first President was elected',
      'The Revolutionary War ended'
    ],
    rationale: 'Other important historical events that could be confused'
  },
  '66': {
    question: 'When was the Constitution written?',
    answerType: 'date',
    correctAnswers: ['1787'],
    curatedDistractors: ['1776', '1781', '1789', '1791'],
    rationale: 'Other important years in early American history'
  },
  '67': {
    question:
      'The Federalist Papers supported the passage of the U.S. Constitution. Name one of the writers.',
    answerType: 'person-historical',
    correctAnswers: ['(James) Madison', '(Alexander) Hamilton', '(John) Jay', 'Publius'],
    curatedDistractors: [
      'Thomas Jefferson',
      'George Washington',
      'Benjamin Franklin',
      'John Adams'
    ],
    rationale: 'Other Founding Fathers who were not authors of the Federalist Papers'
  },
  '68': {
    question: 'What is one thing Benjamin Franklin is famous for?',
    answerType: 'history',
    correctAnswers: [
      'U.S. diplomat',
      'oldest member of the Constitutional Convention',
      'first Postmaster General of the United States',
      'writer of "Poor Richard\'s Almanac"',
      'started the first free libraries'
    ],
    curatedDistractors: [
      'first President of the United States',
      'wrote the Declaration of Independence',
      'led the Continental Army',
      'first Chief Justice'
    ],
    rationale: 'Other major accomplishments of different Founding Fathers'
  },
  '69': {
    question: 'Who is the "Father of Our Country"?',
    answerType: 'person-historical',
    correctAnswers: ['(George) Washington'],
    curatedDistractors: ['Thomas Jefferson', 'Benjamin Franklin', 'John Adams', 'James Madison'],
    rationale: "Other Founding Fathers who could be confused with Washington's special title"
  },
  '70': {
    question: 'Who was the first President?',
    answerType: 'person-historical',
    correctAnswers: ['(George) Washington'],
    curatedDistractors: ['John Adams', 'Thomas Jefferson', 'James Madison', 'Benjamin Franklin'],
    rationale: 'Other early American leaders'
  },
  '71': {
    question: 'What territory did the United States buy from France in 1803?',
    answerType: 'geography',
    correctAnswers: ['the Louisiana Territory', 'Louisiana'],
    curatedDistractors: [
      'the Alaska Territory',
      'the Oregon Territory',
      'the Florida Territory',
      'the Texas Territory'
    ],
    rationale: 'Other territories acquired by the United States'
  },
  '72': {
    question: 'Name one war fought by the United States in the 1800s.',
    answerType: 'history',
    correctAnswers: ['War of 1812', 'Mexican-American War', 'Civil War', 'Spanish-American War'],
    curatedDistractors: ['World War I', 'World War II', 'Korean War', 'Vietnam War'],
    rationale: 'Wars fought by the United States in other centuries'
  },
  '73': {
    question: 'Name the U.S. war between the North and the South.',
    answerType: 'history',
    correctAnswers: ['the Civil War', 'the War between the States'],
    curatedDistractors: [
      'the Revolutionary War',
      'the War of 1812',
      'the Mexican-American War',
      'the Spanish-American War'
    ],
    rationale: 'Other American wars'
  },
  '74': {
    question: 'Name one problem that led to the Civil War.',
    answerType: 'history',
    correctAnswers: ['slavery', 'economic reasons', "states' rights"],
    curatedDistractors: [
      'taxation without representation',
      'foreign interference',
      'religious differences',
      'territorial expansion'
    ],
    rationale: 'Other historical conflicts that were not primary causes of the Civil War'
  },
  '75': {
    question: 'What was one important thing that Abraham Lincoln did?',
    answerType: 'history',
    correctAnswers: [
      'freed the slaves (Emancipation Proclamation)',
      'saved (or preserved) the Union',
      'led the United States during the Civil War'
    ],
    curatedDistractors: [
      'wrote the Constitution',
      'led the Revolutionary War',
      'purchased Louisiana',
      'established the first political parties'
    ],
    rationale: "Other major historical accomplishments that were not Lincoln's"
  },
  '76': {
    question: 'What did the Emancipation Proclamation do?',
    answerType: 'history',
    correctAnswers: [
      'freed the slaves',
      'freed slaves in the Confederacy',
      'freed slaves in the Confederate states',
      'freed slaves in most Southern states'
    ],
    curatedDistractors: [
      'ended the Civil War',
      'gave women the right to vote',
      'established civil rights',
      'created the Constitution'
    ],
    rationale: 'Other major historical actions'
  },
  '77': {
    question: 'What did Susan B. Anthony do?',
    answerType: 'history',
    correctAnswers: ["fought for women's rights", 'fought for civil rights'],
    curatedDistractors: [
      'led the Underground Railroad',
      'founded the Red Cross',
      'was the first woman doctor',
      "wrote Uncle Tom's Cabin"
    ],
    rationale: 'Other historical accomplishments by women'
  },
  '78': {
    question: 'Name one war fought by the United States in the 1900s.',
    answerType: 'history',
    correctAnswers: [
      'World War I',
      'World War II',
      'Korean War',
      'Vietnam War',
      '(Persian) Gulf War'
    ],
    curatedDistractors: [
      'Civil War',
      'War of 1812',
      'Mexican-American War',
      'Spanish-American War'
    ],
    rationale: 'Wars fought by the United States in other centuries'
  },
  '79': {
    question: 'Who was President during World War I?',
    answerType: 'person-historical',
    correctAnswers: ['(Woodrow) Wilson'],
    curatedDistractors: [
      '(Franklin) Roosevelt',
      '(Theodore) Roosevelt',
      '(Harry) Truman',
      '(Herbert) Hoover'
    ],
    rationale: 'Other early 20th-century presidents'
  },
  '80': {
    question: 'Who was President during the Great Depression and World War II?',
    answerType: 'person-historical',
    correctAnswers: ['(Franklin) Roosevelt'],
    curatedDistractors: [
      '(Theodore) Roosevelt',
      '(Harry) Truman',
      '(Woodrow) Wilson',
      '(Herbert) Hoover'
    ],
    rationale: 'Other presidents from the early-to-mid 20th century'
  },
  '81': {
    question: 'Who did the United States fight in World War II?',
    answerType: 'history',
    correctAnswers: ['Japan, Germany, and Italy'],
    curatedDistractors: [
      'Britain, France, and Russia',
      'China, Korea, and Vietnam',
      'Mexico, Spain, and Portugal',
      'Soviet Union, Poland, and Czechoslovakia'
    ],
    rationale: 'Other countries that could be confused with the Axis powers'
  },
  '82': {
    question: 'Before he was President, Eisenhower was a general. What war was he in?',
    answerType: 'history',
    correctAnswers: ['World War II'],
    curatedDistractors: ['World War I', 'Korean War', 'Vietnam War', 'Civil War'],
    rationale: 'Other major wars'
  },
  '83': {
    question: 'During the Cold War, what was the main concern of the United States?',
    answerType: 'history',
    correctAnswers: ['Communism'],
    curatedDistractors: ['Fascism', 'Terrorism', 'Economic depression', 'Nuclear weapons'],
    rationale:
      'Other major concerns that could be confused with the primary Cold War ideology conflict'
  },
  '84': {
    question: 'What movement tried to end racial discrimination?',
    answerType: 'history',
    correctAnswers: ['civil rights (movement)'],
    curatedDistractors: [
      "women's suffrage movement",
      'labor movement',
      'progressive movement',
      'temperance movement'
    ],
    rationale: 'Other social movements'
  },
  '85': {
    question: 'What did Martin Luther King, Jr. do?',
    answerType: 'history',
    correctAnswers: ['fought for civil rights', 'worked for equality for all Americans'],
    curatedDistractors: [
      'led the Underground Railroad',
      'founded the NAACP',
      'was the first Black Supreme Court justice',
      'integrated professional baseball'
    ],
    rationale: 'Other civil rights achievements'
  },
  '86': {
    question: 'What major event happened on September 11, 2001, in the United States?',
    answerType: 'history',
    correctAnswers: ['Terrorists attacked the United States'],
    curatedDistractors: [
      'The Berlin Wall fell',
      'The Cold War ended',
      'Pearl Harbor was attacked',
      'The Stock Market crashed'
    ],
    rationale: 'Other major historical events'
  },
  '87': {
    question: 'Name one American Indian tribe in the United States.',
    answerType: 'history',
    correctAnswers: [
      'Cherokee',
      'Navajo',
      'Sioux',
      'Chippewa',
      'Choctaw',
      'Pueblo',
      'Apache',
      'Iroquois',
      'Creek',
      'Blackfeet',
      'Seminole',
      'Cheyenne',
      'Arawak',
      'Shawnee',
      'Mohegan',
      'Huron',
      'Oneida',
      'Lakota',
      'Crow',
      'Teton',
      'Hopi',
      'Inuit'
    ],
    curatedDistractors: ['Aztec', 'Inca', 'Maya', 'Olmec'],
    rationale: 'Indigenous groups from other parts of the Americas'
  },

  // INTEGRATED CIVICS - GEOGRAPHY (Questions 88-95)
  '88': {
    question: 'Name one of the two longest rivers in the United States.',
    answerType: 'geography',
    correctAnswers: ['Missouri (River)', 'Mississippi (River)'],
    curatedDistractors: ['Colorado (River)', 'Columbia (River)', 'Rio Grande', 'Ohio (River)'],
    rationale: 'Other major US rivers'
  },
  '89': {
    question: 'What ocean is on the West Coast of the United States?',
    answerType: 'geography',
    correctAnswers: ['Pacific (Ocean)'],
    curatedDistractors: ['Atlantic (Ocean)', 'Indian (Ocean)', 'Arctic (Ocean)', 'Gulf of Mexico'],
    rationale: 'Other major bodies of water'
  },
  '90': {
    question: 'What ocean is on the East Coast of the United States?',
    answerType: 'geography',
    correctAnswers: ['Atlantic (Ocean)'],
    curatedDistractors: ['Pacific (Ocean)', 'Indian (Ocean)', 'Arctic (Ocean)', 'Gulf of Mexico'],
    rationale: 'Other major bodies of water'
  },
  '91': {
    question: 'Name one U.S. territory.',
    answerType: 'geography',
    correctAnswers: [
      'Puerto Rico',
      'U.S. Virgin Islands',
      'American Samoa',
      'Northern Mariana Islands',
      'Guam'
    ],
    curatedDistractors: ['Hawaii', 'Alaska', 'District of Columbia', 'Philippines'],
    rationale: 'Former territories or areas associated with the US that are not current territories'
  },
  '92': {
    question: 'Name one state that borders Canada.',
    answerType: 'geography',
    correctAnswers: [
      'Maine',
      'New Hampshire',
      'Vermont',
      'New York',
      'Pennsylvania',
      'Ohio',
      'Michigan',
      'Minnesota',
      'North Dakota',
      'Montana',
      'Idaho',
      'Washington',
      'Alaska'
    ],
    curatedDistractors: ['California', 'Texas', 'Florida', 'Georgia'],
    rationale: 'States that border other countries or are far from the Canadian border'
  },
  '93': {
    question: 'Name one state that borders Mexico.',
    answerType: 'geography',
    correctAnswers: ['California', 'Arizona', 'New Mexico', 'Texas'],
    curatedDistractors: ['Nevada', 'Colorado', 'Oklahoma', 'Louisiana'],
    rationale: 'States that are near Mexico but do not actually border it'
  },
  '94': {
    question: 'What is the capital of the United States?',
    answerType: 'geography',
    correctAnswers: ['Washington, D.C.'],
    curatedDistractors: ['New York City', 'Philadelphia', 'Boston', 'Richmond'],
    rationale:
      'Other major cities that were capitals or could be confused with the national capital'
  },
  '95': {
    question: 'Where is the Statue of Liberty?',
    answerType: 'geography',
    correctAnswers: [
      'New York (Harbor)',
      'Liberty Island',
      'New Jersey',
      'near New York City',
      'on the Hudson (River)'
    ],
    curatedDistractors: ['Washington, D.C.', 'Philadelphia', 'Boston Harbor', 'San Francisco Bay'],
    rationale: 'Other major cities or landmarks'
  },

  // INTEGRATED CIVICS - SYMBOLS AND HOLIDAYS (Questions 96-100)
  '96': {
    question: 'Why does the flag have 13 stripes?',
    answerType: 'concept',
    correctAnswers: [
      'because there were 13 original colonies',
      'because the stripes represent the original colonies',
      'because there were 13 original states'
    ],
    curatedDistractors: [
      'because there are 13 senators',
      'because there are 13 founding fathers',
      'because it represents 13 years of independence',
      'because there are 13 amendments'
    ],
    rationale:
      'Other numbers or concepts that could be confused with the number of original colonies'
  },
  '97': {
    question: 'Why does the flag have 50 stars?',
    answerType: 'concept',
    correctAnswers: [
      'because there is one star for each state',
      'because each star represents a state',
      'because there are 50 states'
    ],
    curatedDistractors: [
      'because there are 50 original colonies',
      'because there are 50 senators',
      'because there are 50 founding fathers',
      'because it represents 50 years of independence'
    ],
    rationale: 'Other numbers or concepts that could be confused with the number of states'
  },
  '98': {
    question: 'What is the name of the national anthem?',
    answerType: 'anthem',
    correctAnswers: ['The Star-Spangled Banner'],
    curatedDistractors: [
      'America the Beautiful',
      "My Country, 'Tis of Thee",
      'God Bless America',
      'Battle Hymn of the Republic'
    ],
    rationale: 'Other patriotic American songs'
  },
  '99': {
    question: 'When do we celebrate Independence Day?',
    answerType: 'date',
    correctAnswers: ['July 4'],
    curatedDistractors: ['July 3', 'July 5', 'December 25', 'January 1'],
    rationale: 'Other dates that could be confused with Independence Day'
  },
  '100': {
    question: 'Name two national U.S. holidays.',
    answerType: 'holidays',
    correctAnswers: [
      "New Year's Day",
      'Martin Luther King, Jr. Day',
      "Presidents' Day",
      'Memorial Day',
      'Independence Day',
      'Labor Day',
      'Columbus Day',
      'Veterans Day',
      'Thanksgiving',
      'Christmas'
    ],
    curatedDistractors: ['Easter', "Mother's Day", "Father's Day", 'Halloween'],
    rationale: 'Other holidays that are not official federal holidays'
  }
}
