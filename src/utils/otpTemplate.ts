export const otpEmailTemplate = (otp: string, email: string) => {
  const year = new Date().getFullYear();

  return `
<!DOCTYPE html>
<html>
<body style="
  margin:0;
  background:#0a0a0f;
  font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial;
  color:#fff;
">

<table width="100%" cellpadding="0" cellspacing="0">
<tr>
<td align="center" style="padding:60px 16px;">

  <!-- MAIN CARD -->
  <table width="100%" style="
    max-width:460px;
    background:rgba(20,20,30,0.85);
    border-radius:20px;
    padding:42px 34px;
    border:1px solid rgba(120,120,255,0.15);
    box-shadow:
      0 0 40px rgba(120,0,255,0.25),
      0 20px 60px rgba(0,0,0,0.8);
  ">

    <!-- HEADER -->
    <tr>
      <td align="center" style="padding-bottom:28px;">
        <div style="
          display:flex;
          align-items:center;
          justify-content:center;
          gap:10px;
        ">
          <div style="
            width:42px;
            height:42px;
            border-radius:50%;
            background:linear-gradient(135deg,#7c3aed,#4f46e5);
            display:flex;
            align-items:center;
            justify-content:center;
            box-shadow:0 0 20px rgba(124,58,237,0.6);
          ">
            <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAYAAACM/rhtAAAACXBIWXMAAA7DAAAOwwHHb6hkAAAAGXRFWHRTb2Z0d2FyZQB3d3cuaW5rc2NhcGUub3Jnm+48GgAAAVhJREFUWIXtmE1OwzAQhb8gWLCBK3THT84TuC5sE7ECA2LVK7BiAzKL2qpxQyp7nkQl/CRLyXjifJ2XcZt23nsOWUd/DbBPDdCqBmhVA7RKDdgD18oF1YADcKNcsBN/kzg2H/pKtaCygtHeS4Q2KwGH5Fhms9Jix7Zyr4hsVlWwB86BLowzRDarAAdgTM5HRDYrAafkfAJuFQsrAGP35oCSblYADoAHHpLYFGJmmxVd7IBj4CKLvwFfGLvZWsE5e6MkNlsB4+b8GyAYbVYBjjNzMWbqZssz2ANPwCebjfkjmz8F3oGTkPtccxNLBWP1HtmFI8RcOK62WQE49/yRzVXbXGtxtLf0mmKbays47E/ZUZXNCsA1218x+VgneVU21wDmL0Z3C7npXNWmXQOY23u/kJvPldvsvS8dzv/UaiF3leW+lN5P/VYn17/7Z0GuBmhVA7Tq4AG/ARyQxBjRxC5kAAAAAElFTkSuQmCC" width="24" height="24"/>
          </div>

          <span style="
            font-size:20px;
            font-weight:600;
            letter-spacing:0.5px;
          ">
            Aureon
          </span>
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

    <!-- TEXT -->
    <tr>
      <td align="center" style="
        padding:16px 0 34px;
        font-size:14px;
        color:#a1a1aa;
        line-height:1.6;
      ">
        Enter this code to securely access your account.<br/>
        Valid for <span style="color:#fff;">5 minutes</span>.
      </td>
    </tr>

    <!-- OTP (MATCHING YOUR UI GLOW) -->
    <tr>
      <td align="center">
        <div style="
          background:rgba(30,30,45,0.9);
          padding:20px 30px;
          border-radius:14px;
          display:inline-block;
          border:1px solid rgba(124,58,237,0.25);
          box-shadow:
            0 0 20px rgba(124,58,237,0.3),
            inset 0 2px 6px rgba(0,0,0,0.6);
        ">
          <span style="
            font-size:32px;
            font-weight:700;
            letter-spacing:12px;
            color:#c4b5fd;
          ">
            ${otp}
          </span>
        </div>
      </td>
    </tr>

    <!-- NOTE -->
    <tr>
      <td align="center" style="
        padding-top:26px;
        font-size:13px;
        color:#71717a;
      ">
        If this wasn’t you, ignore this email.
      </td>
    </tr>

    <!-- FOOTER -->
    <tr>
      <td align="center" style="
        padding-top:34px;
        font-size:12px;
        color:#52525b;
        line-height:1.6;
      ">
        © ${year} Aureon<br/>
        Sent to ${email}
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
