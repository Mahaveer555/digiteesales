import { addDays, format } from 'date-fns';

export interface StructuredVoiceResult {
  companyName: string;
  ownerName?: string;
  meetingStatus: 'COMPLETED' | 'SCHEDULED' | 'RESCHEDULED';
  interestLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'HOT';
  status: 'MEETING_COMPLETED' | 'INTERESTED' | 'HOT_LEAD' | 'FINAL_DISCUSSION' | 'CALLBACK_REQUESTED';
  servicesRequired: string[];
  nextFollowUpDays: number;
  nextFollowUpDate: string; // DD-MM-YYYY
  nextFollowUpTime: string;
  followUpType: 'PHONE_CALL' | 'CLIENT_VISIT' | 'WHATSAPP' | 'FINAL_DISCUSSION';
  remarks: string;
  clientBudget?: number;
}

export function parseVoiceInputToCRM(transcript: string): StructuredVoiceResult {
  const text = transcript.toLowerCase();
  const rawText = transcript;

  // 1. Company Name detection
  let companyName = 'New Client';
  // Check patterns like "...शर्मा इंडस्ट्रीज...", "...industries", "...enterprises", "...pvt ltd", "...traders", "...technologies"
  const companyPatterns = [
    /(?:गया था|विजिट किया|मिला|क्लाइंट|कंपनी|company|client|visited)\s+([A-Za-z0-9\u0900-\u097F\s]{2,30}?)(?:\s+गया|\s+से मुलाकात|\s+के मालिक|\s+owner|\s+office|\s+industries|\s+traders|\s+pvt|\s+ltd)/i,
    /([A-Za-z0-9\u0900-\u097F\s]{2,25}(?:industries|enterprises|traders|technologies|solutions|corporation|textiles|pvt ltd|ltd|इंडस्ट्रीज|ट्रेडर्स|इंटरप्राइजेज))/i,
  ];

  for (const regex of companyPatterns) {
    const match = transcript.match(regex);
    if (match && match[1]) {
      companyName = match[1].trim();
      break;
    }
  }

  if (companyName === 'New Client') {
    // Check if Hindi words like "शर्मा इंडस्ट्रीज" exist
    if (transcript.includes('शर्मा इंडस्ट्रीज') || text.includes('sharma industries')) {
      companyName = 'Sharma Industries';
    } else if (transcript.includes('वर्मा') || text.includes('verma')) {
      companyName = 'Verma Enterprises';
    } else if (transcript.includes('गुप्ता') || text.includes('gupta')) {
      companyName = 'Gupta Traders';
    } else {
      // Pick first capitalized words or subject
      const words = transcript.split(/\s+/).slice(0, 5).join(' ');
      if (words.length > 3) companyName = words.substring(0, 25);
    }
  }

  // 2. Meeting Status
  let meetingStatus: 'COMPLETED' | 'SCHEDULED' | 'RESCHEDULED' = 'COMPLETED';
  if (text.includes('scheduled') || text.includes('रखना है') || text.includes('मिलना है')) {
    meetingStatus = 'SCHEDULED';
  } else if (text.includes('reschedule') || text.includes('कैंसल') || text.includes('टाल दिया')) {
    meetingStatus = 'RESCHEDULED';
  } else {
    meetingStatus = 'COMPLETED';
  }

  // 3. Interest Level & Pipeline Status
  let interestLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'HOT' = 'HIGH';
  let leadStatus: 'MEETING_COMPLETED' | 'INTERESTED' | 'HOT_LEAD' | 'FINAL_DISCUSSION' | 'CALLBACK_REQUESTED' = 'INTERESTED';

  if (text.includes('hot') || text.includes('बहुत ज्यादा इंटरेस्ट') || text.includes('फाइनल करना चाहते') || text.includes('ready to buy')) {
    interestLevel = 'HOT';
    leadStatus = 'HOT_LEAD';
  } else if (text.includes('फाइनल डिस्कशन') || text.includes('final discussion') || text.includes('डील क्लोज') || text.includes('close')) {
    interestLevel = 'HOT';
    leadStatus = 'FINAL_DISCUSSION';
  } else if (text.includes('फोन करना') || text.includes('कॉल बैक') || text.includes('call back') || text.includes('callback')) {
    interestLevel = 'HIGH';
    leadStatus = 'CALLBACK_REQUESTED';
  } else if (text.includes('नॉट इंटरेस्टेड') || text.includes('not interested') || text.includes('मना कर दिया')) {
    interestLevel = 'LOW';
    leadStatus = 'MEETING_COMPLETED';
  } else {
    interestLevel = 'HIGH';
    leadStatus = 'INTERESTED';
  }

  // 4. Services Required
  const services: string[] = [];
  if (text.includes('वेबसाइट') || text.includes('website') || text.includes('web development')) {
    services.push('Website Development');
  }
  if (text.includes('डिजिटल मार्केटिंग') || text.includes('digital marketing') || text.includes('marketing') || text.includes('मार्केटिंग')) {
    services.push('Digital Marketing');
  }
  if (text.includes('एसईओ') || text.includes('seo') || text.includes('google ads') || text.includes('ads')) {
    services.push('SEO & Google Ads');
  }
  if (text.includes('सॉफ्टवेयर') || text.includes('software') || text.includes('crm') || text.includes('erp')) {
    services.push('Custom CRM & ERP');
  }
  if (text.includes('मोबाइल ऐप') || text.includes('app') || text.includes('application')) {
    services.push('Mobile App');
  }
  if (services.length === 0) {
    services.push('Website Development', 'Digital Marketing');
  }

  // 5. Follow-up Days & Date Calculation
  let daysLater = 3;
  if (text.includes('पांच दिन') || text.includes('5 दिन') || text.includes('5 days') || text.includes('five days')) {
    daysLater = 5;
  } else if (text.includes('कल') || text.includes('tomorrow') || text.includes('1 दिन') || text.includes('1 day')) {
    daysLater = 1;
  } else if (text.includes('दो दिन') || text.includes('2 दिन') || text.includes('2 days') || text.includes('two days')) {
    daysLater = 2;
  } else if (text.includes('तीन दिन') || text.includes('3 दिन') || text.includes('3 days') || text.includes('three days')) {
    daysLater = 3;
  } else if (text.includes('एक हफ्ते') || text.includes('हफ्ते बाद') || text.includes('week') || text.includes('7 days')) {
    daysLater = 7;
  } else if (text.includes('दस दिन') || text.includes('10 days')) {
    daysLater = 10;
  }

  const calculatedDate = addDays(new Date(), daysLater);
  const nextFollowUpDate = format(calculatedDate, 'dd-MM-yyyy');

  // 6. Follow-up Type
  let followUpType: 'PHONE_CALL' | 'CLIENT_VISIT' | 'WHATSAPP' | 'FINAL_DISCUSSION' = 'PHONE_CALL';
  if (text.includes('विजिट') || text.includes('visit') || text.includes('ऑफिस जाना') || text.includes('मिलना')) {
    followUpType = 'CLIENT_VISIT';
  } else if (text.includes('whatsapp') || text.includes('व्हाट्सएप') || text.includes('मैसेज')) {
    followUpType = 'WHATSAPP';
  } else if (text.includes('फाइनल') || text.includes('final discussion')) {
    followUpType = 'FINAL_DISCUSSION';
  } else {
    followUpType = 'PHONE_CALL';
  }

  // 7. Time
  let nextFollowUpTime = '11:00 AM';
  if (text.includes('दोपहर') || text.includes('afternoon') || text.includes('3 बजे') || text.includes('3 pm')) {
    nextFollowUpTime = '03:00 PM';
  } else if (text.includes('शाम') || text.includes('evening') || text.includes('5 बजे') || text.includes('5 pm')) {
    nextFollowUpTime = '05:00 PM';
  } else if (text.includes('10 बजे') || text.includes('10 am')) {
    nextFollowUpTime = '10:00 AM';
  }

  // 8. Remarks
  let remarks = `Voice Record: ${rawText.trim()}`;
  if (text.includes('फोन करना') || text.includes('कहा है कि') || text.includes('requested callback')) {
    remarks = `Client requested follow-up call after ${daysLater} days. Interested in ${services.join(', ')}.`;
  }

  return {
    companyName,
    ownerName: text.includes('मालिक') || text.includes('owner') ? 'Owner / Director' : 'Business Head',
    meetingStatus,
    interestLevel,
    status: leadStatus,
    servicesRequired: services,
    nextFollowUpDays: daysLater,
    nextFollowUpDate,
    nextFollowUpTime,
    followUpType,
    remarks,
    clientBudget: 75000,
  };
}
