const LOGO_BASE64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAYAAACM/rhtAAAACXBIWXMAAA7DAAAOwwHHb6hkAAAAGXRFWHRTb2Z0d2FyZQB3d3cuaW5rc2NhcGUub3Jnm+48GgAAAVhJREFUWIXtmE1OwzAQhb8gWLCBK3THT84TuC5sE7ECA2LVK7BiAzKL2qpxQyp7nkQl/CRLyXjifJ2XcZt23nsOWUd/DbBPDdCqBmhVA7RKDdgD18oF1YADcKNcsBN/kzg2H/pKtaCygtHeS4Q2KwGH5Fhms9Jix7Zyr4hsVlWwB86BLowzRDarAAdgTM5HRDYrAafkfAJuFQsrAGP35oCSblYADoAHHpLYFGJmmxVd7IBj4CKLvwFfGLvZWsE5e6MkNlsB4+b8GyAYbVYBjjNzMWbqZssz2ANPwCebjfkjmz8F3oGTkPtccxNLBWP1HtmFI8RcOK62WQE49/yRzVXbXGtxtLf0mmKbays47E/ZUZXNCsA1218x+VgneVU21wDmL0Z3C7npXNWmXQOY23u/kJvPldvsvS8dzv/UaiF3leW+lN5P/VYn17/7Z0GuBmhVA7Tq4AG/ARyQxBjRxC5kAAAAAElFTkSuQmCC"

export const otpEmailTemplate = (otp: string, email: string) => {
  const year = new Date().getFullYear();

  return `
<!DOCTYPE html>
<html>
<body style="
  margin:0;
  background:#f2f4f7;
  font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial;
  color:#111;
">

<table width="100%" cellpadding="0" cellspacing="0">
<tr>
<td align="center" style="padding:64px 16px;">

  <table width="100%" style="
    max-width:480px;
    background:#ffffff;
    border-radius:22px;
    padding:44px 40px;
    box-shadow:
      0 20px 50px rgba(0,0,0,0.08),
      0 2px 6px rgba(0,0,0,0.04);
  ">

    <!-- BRAND -->
    <tr>
      <td align="center" style="padding-bottom:30px;">
        <div style="
          width:64px;
          height:64px;
          border-radius:50%;
          background:linear-gradient(145deg,#0b0b0b,#1c1c1c);
          display:flex;
          align-items:center;
          justify-content:center;
          margin:auto;
          box-shadow:
            inset 0 1px 1px rgba(255,255,255,0.08),
            0 10px 22px rgba(0,0,0,0.25);
        ">
          <img
            src="${LOGO_BASE64}"
            width="40"
            height="40"
            alt="Aureon"
            style="display:block;"
          />
        </div>

        <div style="
          margin-top:14px;
          font-size:20px;
          font-weight:600;
          letter-spacing:0.6px;
        ">
          Aureon
        </div>
      </td>
    </tr>

    <!-- TITLE -->
    <tr>
      <td align="center">
        <h2 style="
          margin:0;
          font-size:24px;
          font-weight:600;
        ">
          Confirm your email
        </h2>
      </td>
    </tr>

    <!-- SUBTEXT -->
    <tr>
      <td align="center" style="
        padding:18px 0 36px;
        font-size:15px;
        color:#555;
        line-height:1.7;
      ">
        Enter the verification code below to continue.<br/>
        This code will expire in <strong>5 minutes</strong>.
      </td>
    </tr>

    <!-- OTP -->
    <tr>
      <td align="center">
        <div style="
          background:linear-gradient(180deg,#f6f7f9,#eef1f5);
          padding:18px 38px;
          border-radius:16px;
          font-size:32px;
          font-weight:700;
          letter-spacing:10px;
          color:#111;
          display:inline-block;
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.9),
            0 8px 18px rgba(0,0,0,0.08);
        ">
          ${otp}
        </div>
      </td>
    </tr>

    <!-- NOTE -->
    <tr>
      <td align="center" style="
        padding-top:30px;
        font-size:13px;
        color:#777;
      ">
        If you did not request this, you can safely ignore this email.
      </td>
    </tr>

    <!-- FOOTER -->
    <tr>
      <td align="center" style="
        padding-top:38px;
        font-size:12px;
        color:#999;
        line-height:1.7;
      ">
        © ${year} Aureon · All rights reserved<br/>
        This email was sent to ${email}
      </td>
    </tr>

  </table>

</td>
</tr>
</table>

</body>
</html>
`;
};
