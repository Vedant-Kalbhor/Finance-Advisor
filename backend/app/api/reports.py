from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from io import BytesIO
from fpdf import FPDF
from datetime import datetime

from ..db.session import get_db
from ..models.user import User, Profile, Goal, Investment
from .auth import get_current_user
from ..ai.report_generator import generate_comprehensive_financial_report

router = APIRouter()

class FinancialReportPDF(FPDF):
    def header(self):
        # Background color for header
        self.set_fill_color(17, 24, 39) # #111827 Dark Navy
        self.rect(0, 0, 210, 40, 'F')
        
        self.set_font('Helvetica', 'B', 24)
        self.set_text_color(255, 255, 255)
        self.cell(0, 20, 'FINANCIAL REPORT', 0, 1, 'C')
        
        self.set_font('Helvetica', 'I', 10)
        self.cell(0, -5, f'Generated on: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")} | FINANCE ADVISOR AI', 0, 1, 'C')
        self.ln(20)

    def footer(self):
        self.set_y(-15)
        self.set_font('Helvetica', 'I', 8)
        self.set_text_color(156, 163, 175) # Gray-400
        self.cell(0, 10, f'Page {self.page_no()} | Financial Document', 0, 0, 'C')

def create_pdf_report(user_name, report_text, user_data):
    """
    Creates a structured PDF with fpdf2.
    """
    pdf = FinancialReportPDF()
    pdf.set_auto_page_break(auto=True, margin=15)
    pdf.add_page()
    pdf.set_font('Helvetica', '', 12)
    
    # Client Summary Section
    pdf.set_font('Helvetica', 'B', 16)
    pdf.set_text_color(16, 185, 129) # #10B981 Emerald
    pdf.cell(0, 10, f'STRATEGIC OVERVIEW: {user_name.upper()}', 0, 1, 'L')
    pdf.ln(5)
    
    # Financial Stats Table
    pdf.set_fill_color(249, 250, 251) # Gray-50
    pdf.set_text_color(0, 0, 0)
    pdf.set_font('Helvetica', 'B', 10)
    pdf.cell(40, 10, 'Metric', 1, 0, 'C', True)
    pdf.cell(100, 10, 'Value', 1, 1, 'C', True)
    
    pdf.set_font('Helvetica', '', 10)
    stats = [
        ("Monthly Income", f"INR {user_data['profile'].get('monthly_income', 0):,.2f}"),
        ("Monthly Expenses", f"INR {user_data['profile'].get('monthly_expenses', 0):,.2f}"),
        ("Risk Appetite", f"{user_data['profile'].get('risk_profile', 'Moderate')}"),
        ("Total Assets Found", f"{len(user_data['investments'])} Items"),
    ]
    for metric, val in stats:
        pdf.cell(40, 8, metric, 1, 0, 'L')
        pdf.cell(100, 8, val, 1, 1, 'L')
    
    pdf.ln(10)
    
    # AI Report Section
    sections = report_text.split('\n\n')
    for section in sections:
        if any(hdr in section.upper() for hdr in ['EXECUTIVE SUMMARY', 'ANALYSIS', 'RECOMMENDATIONS', 'STRATEGIC']):
            pdf.set_font('Helvetica', 'B', 14)
            pdf.set_text_color(17, 24, 39) # Dark Navy
            pdf.cell(0, 10, section.split('\n')[0].strip(), 0, 1, 'L')
            pdf.ln(2)
            pdf.set_font('Helvetica', '', 10)
            pdf.set_text_color(55, 65, 81) # Gray-700
            content = '\n'.join(section.split('\n')[1:])
            pdf.multi_cell(0, 6, content.strip())
        else:
            pdf.set_font('Helvetica', '', 10)
            pdf.set_text_color(55, 65, 81)
            pdf.multi_cell(0, 6, section.strip())
        pdf.ln(5)
        
    return pdf.output()

@router.get("/generate/{report_type}")
async def generate_pdf_report(
    report_type: str,
    current_user: User = Depends(get_current_user),
    db = Depends(get_db)
):
    """
    Generate and stream a professional financial report PDF.
    """
    # 1. Gather all user context
    profile = current_user.profile
    investments = db.query(Investment).filter(Investment.user_id == current_user.id).all()
    goals = db.query(Goal).filter(Goal.user_id == current_user.id).all()
    
    user_context = {
        "profile": {
            "full_name": current_user.full_name,
            "age": profile.age,
            "monthly_income": profile.monthly_income,
            "monthly_expenses": profile.monthly_expenses,
            "risk_profile": profile.risk_profile,
            "location": profile.location
        },
        "investments": [{"name": i.name, "amount": i.amount, "type": i.type} for i in investments],
        "goals": [{"name": g.name, "target_amount": g.target_amount} for g in goals]
    }
    
    # 2. Get AI Content (Primary Ollama, secondary Gemini)
    ai_report_text = await generate_comprehensive_financial_report(user_context, report_type)
    
    # 3. Create PDF
    try:
        pdf_bytes = create_pdf_report(current_user.full_name, ai_report_text, user_context)
        
        buffer = BytesIO(pdf_bytes)
        filename = f"Financial_Report_{report_type}_{datetime.now().strftime('%Y%m%d')}.pdf"
        
        return StreamingResponse(
            buffer,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    except Exception as e:
        print(f"[PDF Gen] Error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to generate professional report PDF: {e}")
