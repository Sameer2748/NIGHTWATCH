
use std::sync::{Arc, Mutex};
use poem::{ handler, web::{Path, Json, Data}};

use crate::{auth_middleware::UserId, req_inputs::{CreateWebsiteRequest}};
use crate::req_outputs::{CreateWebsiteResponse,GetWebsiteResponse};
use store::store::Store;

#[handler]
pub fn getwebsite(Path(id): Path<String>, Data(s): Data<&Arc<Mutex<Store>>>, UserId(user_id): UserId) -> Json<GetWebsiteResponse> {
    // store the url in the store library 
    let mut locked_s = s.lock().unwrap();
    let website = locked_s
        .get_website(id, user_id.clone())
        .unwrap();
    Json(GetWebsiteResponse{url: website.url, id:website.id, user_id: user_id})

}
#[handler]
pub fn createwebsite(Json(data): Json<CreateWebsiteRequest>, Data(s): Data<&Arc<Mutex<Store>>>,  UserId(user_id): UserId) -> Json<CreateWebsiteResponse> {
    let url: String = data.url;
    // store the url in the store library 
    let mut locked_s = s.lock().unwrap(); 
    let website = locked_s
        .create_website(user_id, url)
        .expect("Failed to persist website");

    let response: CreateWebsiteResponse = CreateWebsiteResponse {
        id: website.id
    };

    Json(response)
}
