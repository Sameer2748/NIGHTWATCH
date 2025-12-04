use crate::store::Store;
use chrono::{NaiveDateTime, Utc};
use diesel::prelude::*;
use uuid::Uuid;

#[derive(Queryable, Selectable, Insertable)]
#[diesel(table_name = crate::schema::Website)]
#[diesel(check_for_backend(diesel::pg::Pg))]
pub struct DbWebsite {
    pub id: String,
    pub url: String,
    pub user_id: String,
    pub timeAdded: NaiveDateTime,
}

impl Store {   
    // we write this & self to make the function a method of the struct
    pub fn create_website(&mut self, user_id: String, url: String) -> Result<DbWebsite, diesel::result::Error> {
        let id = Uuid::new_v4();
        let website_data = DbWebsite {
            id: id.to_string(),
            url,
            user_id,
            timeAdded: Utc::now().naive_utc(),
        };
        let website = diesel::insert_into(crate::schema::Website::table)
            .values(&website_data)
            .returning(DbWebsite::as_returning())
            .get_result::<DbWebsite>(&mut self.conn)?;

        Ok(website)
    }
    pub fn get_website(&mut self, input_id: String) -> Result<DbWebsite, diesel::result::Error> {
        use crate::schema::Website::dsl::{Website as websites, id};

        let website_result = websites
            .filter(id.eq(input_id))
            .select(DbWebsite::as_select())
            .first::<DbWebsite>(&mut self.conn)?;

        Ok(website_result)
    }
}
