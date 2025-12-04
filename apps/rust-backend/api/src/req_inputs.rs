use serde::{Deserialize, Serialize};

#[derive(Deserialize, Serialize)]
pub struct CreateWebsiteRequest {
    pub url:String
}
#[derive(Deserialize, Serialize)]
pub struct GetWebsiteRequest {
    pub url:String
}
#[derive(Deserialize, Serialize)]
pub struct SignUpUserInput{
    pub name: String,
    pub password: String
}
#[derive(Deserialize, Serialize)]
pub struct SignInUserInput{
    pub name: String,
    pub password: String
}
