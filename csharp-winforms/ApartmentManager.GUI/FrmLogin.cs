using System;
using System.Drawing;
using System.Windows.Forms;
using ApartmentManager.BLL;
using ApartmentManager.DTO;

namespace ApartmentManager.GUI
{
    public partial class FrmLogin : Form
    {
        private UserBLL userBLL = new UserBLL();

        private TextBox txtUsername;
        private TextBox txtPassword;
        private Button btnLogin;
        private Label lblMessage;

        public FrmLogin()
        {
            InitializeComponent();
            SetupUI();
        }

        private void SetupUI()
        {
            this.Text = "Đăng nhập - Apartment Manager Pro";
            this.Size = new Size(400, 300);
            this.StartPosition = FormStartPosition.CenterScreen;
            this.FormBorderStyle = FormBorderStyle.FixedDialog;
            this.MaximizeBox = false;

            Label lblTitle = new Label() { Text = "ĐĂNG NHẬP", Font = new Font("Segoe UI", 16, FontStyle.Bold), Location = new Point(130, 20), AutoSize = true };
            
            Label lblUser = new Label() { Text = "Tên đăng nhập / Email:", Location = new Point(50, 70), AutoSize = true };
            txtUsername = new TextBox() { Location = new Point(50, 90), Width = 300 };

            Label lblPass = new Label() { Text = "Mật khẩu:", Location = new Point(50, 130), AutoSize = true };
            txtPassword = new TextBox() { Location = new Point(50, 150), Width = 300, PasswordChar = '*' };

            btnLogin = new Button() { Text = "Đăng nhập", Location = new Point(50, 200), Width = 300, Height = 40, BackColor = Color.FromArgb(0, 122, 204), ForeColor = Color.White, FlatStyle = FlatStyle.Flat };
            btnLogin.Click += BtnLogin_Click;

            lblMessage = new Label() { ForeColor = Color.Red, Location = new Point(50, 250), Width = 300, TextAlign = ContentAlignment.MiddleCenter };

            this.Controls.AddRange(new Control[] { lblTitle, lblUser, txtUsername, lblPass, txtPassword, btnLogin, lblMessage });
        }

        private void BtnLogin_Click(object sender, EventArgs e)
        {
            string username = txtUsername.Text.Trim();
            string password = txtPassword.Text;

            if (string.IsNullOrEmpty(username) || string.IsNullOrEmpty(password))
            {
                lblMessage.Text = "Vui lòng nhập đầy đủ thông tin.";
                return;
            }

            string message;
            UserDTO user = userBLL.Authenticate(username, password, out message);

            if (user != null)
            {
                MessageBox.Show($"Chào mừng {user.FullName} ({user.RoleName})!", "Thành công", MessageBoxButtons.OK, MessageBoxIcon.Information);
                // Mở FrmMainDashboard dựa trên role
                this.Hide();
                // FrmMain main = new FrmMain(user);
                // main.Show();
            }
            else
            {
                lblMessage.Text = message;
            }
        }
    }
}
