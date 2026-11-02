import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import datetime
import logging

# Configure logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# =====================================================================
# CONFIGURATION: Edit these variables with your real credentials later!
# =====================================================================
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587
SENDER_EMAIL = "your_email@gmail.com"
SENDER_PASSWORD = "your_app_password" # Use a 16-character App Password, NOT your actual password
ADMIN_EMAIL = "admin@yourschool.edu"

def send_violation_email(student_id: str, object_name: str, confidence: float, evidence_path: str = None):
    """
    Sends an automated email notification when a violation is detected.
    Runs synchronously, so it should be called via FastAPI BackgroundTasks.
    """
    
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    subject = f"🚨 AI Alert: Policy Violation Detected [{student_id}]"
    
    html_content = f"""
    <html>
      <body style="font-family: Arial, sans-serif; color: #333;">
        <h2 style="color: #d9534f;">AI Monitoring System Alert</h2>
        <p>A policy violation was just detected by the AI monitoring camera.</p>
        <table style="border-collapse: collapse; width: 100%; max-width: 600px; margin-top: 15px;">
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd; background-color: #f9f9f9; font-weight: bold;">Student ID</td>
            <td style="padding: 8px; border: 1px solid #ddd;">{student_id}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd; background-color: #f9f9f9; font-weight: bold;">Violation Object</td>
            <td style="padding: 8px; border: 1px solid #ddd;">{object_name.upper()}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd; background-color: #f9f9f9; font-weight: bold;">Confidence</td>
            <td style="padding: 8px; border: 1px solid #ddd;">{confidence * 100:.1f}%</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd; background-color: #f9f9f9; font-weight: bold;">Time</td>
            <td style="padding: 8px; border: 1px solid #ddd;">{timestamp}</td>
          </tr>
        </table>
        <p style="margin-top: 20px;">
          Please review the dashboard for the evidence capture.<br>
          <em>This is an automated message from the AI Student Monitoring System.</em>
        </p>
      </body>
    </html>
    """

    # -------------------------------------------------------------
    # FAIL-SAFE MOCK: Don't crash if credentials aren't set up yet
    # -------------------------------------------------------------
    if SENDER_EMAIL == "your_email@gmail.com":
        logger.info("\n" + "="*50)
        logger.info("📧 MOCK EMAIL NOTIFICATION TRIGGERED 📧")
        logger.info(f"To: {ADMIN_EMAIL}")
        logger.info(f"Subject: {subject}")
        logger.info(f"Student: {student_id} | Object: {object_name} | Time: {timestamp}")
        logger.info("NOTE: Edit backend/email_service.py to add real credentials!")
        logger.info("="*50 + "\n")
        return

    # Real Email Transmission
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = SENDER_EMAIL
        msg["To"] = ADMIN_EMAIL
        
        part = MIMEText(html_content, "html")
        msg.attach(part)
        
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(SENDER_EMAIL, SENDER_PASSWORD)
        server.sendmail(SENDER_EMAIL, ADMIN_EMAIL, msg.as_string())
        server.quit()
        
        logger.info(f"✅ Successfully sent violation email for student {student_id}")
        
    except Exception as e:
        logger.error(f"❌ Failed to send email alert: {str(e)}")
