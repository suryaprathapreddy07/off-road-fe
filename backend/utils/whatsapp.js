const axios = require("axios");

class WhatsAppService {
  constructor() {
    this.phoneNumber = process.env.WHATSAPP_PHONE_NUMBER;
    this.apiToken = process.env.WHATSAPP_API_TOKEN;
    this.apiUrl = process.env.WHATSAPP_API_URL;
  }

  async sendMessage(message) {
    try {
      if (!this.phoneNumber || !this.apiToken || !this.apiUrl) {
        console.log(
          "WhatsApp credentials not configured. Message would be:",
          message
        );
        return { success: false, message: "WhatsApp not configured" };
      }

      const response = await axios.post(
        `${this.apiUrl}/${this.phoneNumber}/messages`,
        {
          messaging_product: "whatsapp",
          to: this.phoneNumber,
          type: "text",
          text: {
            body: message,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      return { success: true, data: response.data };
    } catch (error) {
      console.error(
        "WhatsApp send error:",
        error.response?.data || error.message
      );
      return { success: false, error: error.message };
    }
  }

  // Format event registration message
  formatEventRegistrationMessage(registration, event) {
    const message = `🏕️ NEW EVENT REGISTRATION 🏕️

Event: ${event.title}
Date: ${new Date(event.date).toLocaleDateString()}

👤 Participant Details:
Name: ${registration.participantDetails.name}
Email: ${registration.participantDetails.email}
Phone: ${registration.participantDetails.phone}
Experience: ${registration.participantDetails.experience}

🚗 Vehicle Details:
${registration.participantDetails.vehicleDetails.make} ${
      registration.participantDetails.vehicleDetails.model
    } ${registration.participantDetails.vehicleDetails.year}
Modifications: ${registration.participantDetails.vehicleDetails.modifications}

🚨 Emergency Contact:
Name: ${registration.participantDetails.emergencyContact.name}
Phone: ${registration.participantDetails.emergencyContact.phone}
Relationship: ${registration.participantDetails.emergencyContact.relationship}

🏥 Medical Conditions: ${registration.participantDetails.medicalConditions}

💰 Amount: $${registration.paymentAmount}
Status: ${registration.registrationStatus}

${
  registration.participantDetails.additionalNotes
    ? `📝 Notes: ${registration.participantDetails.additionalNotes}`
    : ""
}

Registration ID: ${registration._id}`;

    return message;
  }

  // Format contact form message
  formatContactMessage(contact) {
    const message = `📞 NEW CONTACT FORM SUBMISSION 📞

👤 Contact Details:
Name: ${contact.name}
Email: ${contact.email}
${contact.phone ? `Phone: ${contact.phone}` : ""}

📋 Subject: ${contact.subject}

💬 Message:
${contact.message}

Priority: ${contact.priority.toUpperCase()}
Submitted: ${new Date(contact.createdAt).toLocaleString()}

Contact ID: ${contact._id}`;

    return message;
  }

  // Send event registration notification
  async sendEventRegistrationNotification(registration, event) {
    const message = this.formatEventRegistrationMessage(registration, event);
    return await this.sendMessage(message);
  }

  // Send contact form notification
  async sendContactNotification(contact) {
    const message = this.formatContactMessage(contact);
    return await this.sendMessage(message);
  }
}

module.exports = new WhatsAppService();
