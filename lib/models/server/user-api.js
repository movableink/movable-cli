module.exports = function userApi() {
  return function(req, res) {
    res.end(
      JSON.stringify({
        companies: [{ id: 0, name: "Local", products: { live_content: true } }],
        user: { name: "Local User", company_id: 0, id: "me", features: {} }
      })
    );
  };
};
