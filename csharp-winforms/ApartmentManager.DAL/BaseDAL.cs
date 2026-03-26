using System;
using System.Configuration;
using Microsoft.Data.SqlClient;
using System.Data;

namespace ApartmentManager.DAL
{
    public class BaseDAL
    {
        protected string connectionString;

        public BaseDAL()
        {
            connectionString = ConfigurationManager.ConnectionStrings["ApartmentManagerDB"].ConnectionString;
        }

        protected SqlConnection GetConnection()
        {
            return new SqlConnection(connectionString);
        }

        public bool TestConnection()
        {
            try
            {
                using (SqlConnection conn = GetConnection())
                {
                    conn.Open();
                    return true;
                }
            }
            catch
            {
                return false;
            }
        }
    }
}
