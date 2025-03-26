const Listing = require("../models/listing");

module.exports.index = async(req,res)=>{
    const allListings = await Listing.find({});
    res.render("listings/index.ejs",{allListings});
};

module.exports.renderNewForm = (req,res)=>{
    res.render("listings/new.ejs");
};

module.exports.showListing = async(req,res)=>{
    let {id} = req.params;
    const listing = await Listing.findById(id)
        .populate(
            {   
                path : "reviews",
                populate :{
                    path: "author",
                }
            }).populate("owner");
    if(!listing){
        req.flash("error","Lisitng you requested for does not exist");
        res.redirect("/listings");
    }
    res.render("listings/show.ejs",{listing});
};

module.exports.createListing = async(req,res,next)=>{
    let url = req.file.path;
    let filename = req.file.filename;
    const newListing = new Listing(req.body.listing);
    newListing.image = {url,filename};
    newListing.owner = req.user._id; 
    await newListing.save();
    req.flash("success","New Lisitng Created!");
    res.redirect("/listings");
};

module.exports.renderEditForm = async(req,res)=>{
    let {id} = req.params;
    const listing = await Listing.findById(id);
    if(!listing){
        req.flash("error","Lisitng you requested for does not exist");
        res.redirect("/listings");
    }
    originalImageUrl = listing.image.url;
    originalImageUrl = originalImageUrl.replace("/upload","/upload/w_250");
    res.render("listings/edit.ejs",{listing,originalImageUrl});
};

module.exports.updateListing = async(req,res)=>{
    let {id} = req.params;
    let lisitng = await Listing.findByIdAndUpdate(id,{...req.body.listing});//creates a shallow copy
    if(typeof req.file !== "undefined"){ //req.file will be undefined only if multer doesn't receive any image
        let url = req.file.path;
        let filename = req.file.filename;
        lisitng.image = {url,filename};
        await lisitng.save();
    }           
    req.flash("success","Listing Updated!");
    res.redirect(`/listings/${id}`);
};

module.exports.destroyListing = async(req,res)=>{
    const {id} = req.params;
    let deletedListing = await Listing.findByIdAndDelete(id);
    console.log(deletedListing);
    req.flash("success","Lisitng Deleted!");
    res.redirect("/listings");
};

