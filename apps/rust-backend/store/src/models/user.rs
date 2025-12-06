use crate::store::Store;
use diesel::prelude::*;
use uuid::Uuid;

#[derive(Queryable, Selectable, Insertable)]
#[diesel(table_name = crate::schema::User)]
#[diesel(check_for_backend(diesel::pg::Pg))]
pub struct DbUser {
    id: String,
    name: String,
    password: String,
}



impl Store {
    pub fn signup_user(&mut self, username: String, password: String) -> Result<String, diesel::result::Error> {

        let id = Uuid::new_v4();
        let user = DbUser {
            id: id.to_string(),
            name: username,
            password,
        };
        let _ = diesel::insert_into(crate::schema::User::table)
            .values(&user)
            .returning(DbUser::as_returning())
            .get_result::<DbUser>(&mut self.conn)?;

        Ok(id.to_string())

    }
    pub fn signin_user(&mut self, input_username: String, input_password: String) -> Result<String, diesel::result::Error> {
        use crate::schema::User::dsl::{User as users, name};

        let user_result = users
            .filter(name.eq(&input_username))
            .select(DbUser::as_select())
            .first::<DbUser>(&mut self.conn)?;

        if user_result.password != input_password {
            return Err(diesel::result::Error::NotFound);
        }
        
        Ok(user_result.id.clone())
        
    }

}
