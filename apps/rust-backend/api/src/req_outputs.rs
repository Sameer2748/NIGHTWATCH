use serde::{Deserialize, Serialize};

#[derive(Deserialize, Serialize)]
pub struct CreateWebsiteResponse {
    pub id: String
}
#[derive(Deserialize, Serialize)]
pub struct GetWebsiteResponse {
    pub url: String,
    pub id: String,
    pub user_id: String
}
#[derive(Deserialize, Serialize)]
pub struct SignUpUserOutput{
    pub id: String
}
#[derive(Deserialize, Serialize)]
pub struct SignInUserOutput{
    pub jwt: String
}


