using System;
using System.Collections.Generic;
using Microsoft.Data.SqlClient;
using System.Data;
using ApartmentManager.DTO;

namespace ApartmentManager.DAL
{
    public class UserDAL : BaseDAL
    {
        public UserDTO Login(string usernameOrEmail)
        {
            UserDTO user = null;
            using (SqlConnection conn = GetConnection())
            {
                string query = @"SELECT u.*, r.RoleName 
                                FROM Users u 
                                JOIN Roles r ON u.RoleID = r.RoleID 
                                WHERE u.Username = @Username OR u.Email = @Email";
                
                SqlCommand cmd = new SqlCommand(query, conn);
                cmd.Parameters.AddWithValue("@Username", usernameOrEmail);
                cmd.Parameters.AddWithValue("@Email", usernameOrEmail);

                conn.Open();
                using (SqlDataReader reader = cmd.ExecuteReader())
                {
                    if (reader.Read())
                    {
                        user = MapUser(reader);
                    }
                }
            }
            return user;
        }

        public void UpdateLoginStatus(int userId, bool success)
        {
            using (SqlConnection conn = GetConnection())
            {
                string query = success 
                    ? "UPDATE Users SET FailedLoginCount = 0, LockedUntil = NULL, LastLoginAt = GETDATE() WHERE UserID = @UserID"
                    : "UPDATE Users SET FailedLoginCount = FailedLoginCount + 1 WHERE UserID = @UserID";
                
                SqlCommand cmd = new SqlCommand(query, conn);
                cmd.Parameters.AddWithValue("@UserID", userId);
                conn.Open();
                cmd.ExecuteNonQuery();
            }
        }

        private UserDTO MapUser(SqlDataReader reader)
        {
            return new UserDTO
            {
                UserID = (int)reader["UserID"],
                Username = reader["Username"].ToString(),
                PasswordHash = reader["PasswordHash"].ToString(),
                FullName = reader["FullName"].ToString(),
                Email = reader["Email"].ToString(),
                RoleID = (int)reader["RoleID"],
                RoleName = reader["RoleName"].ToString(),
                Status = reader["Status"].ToString(),
                FailedLoginCount = (int)reader["FailedLoginCount"],
                LockedUntil = reader["LockedUntil"] as DateTime?,
                IsApproved = (bool)reader["IsApproved"]
            };
        }
    }
}
