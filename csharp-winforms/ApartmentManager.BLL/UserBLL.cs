using System;
using ApartmentManager.DAL;
using ApartmentManager.DTO;
using BCrypt.Net;

namespace ApartmentManager.BLL
{
    public class UserBLL
    {
        private UserDAL userDAL = new UserDAL();

        public UserDTO Authenticate(string username, string password, out string message)
        {
            message = "";
            UserDTO user = userDAL.Login(username);

            if (user == null)
            {
                message = "Tài khoản không tồn tại.";
                return null;
            }

            if (user.Status == "Locked" || (user.LockedUntil.HasValue && user.LockedUntil > DateTime.Now))
            {
                message = $"Tài khoản bị khóa đến {user.LockedUntil:HH:mm dd/MM/yyyy}.";
                return null;
            }

            if (!user.IsApproved)
            {
                message = "Tài khoản đang chờ phê duyệt.";
                return null;
            }

            bool isPasswordCorrect = BCrypt.Net.BCrypt.Verify(password, user.PasswordHash);

            if (isPasswordCorrect)
            {
                userDAL.UpdateLoginStatus(user.UserID, true);
                return user;
            }
            else
            {
                userDAL.UpdateLoginStatus(user.UserID, false);
                message = "Mật khẩu không chính xác.";
                return null;
            }
        }
    }
}
