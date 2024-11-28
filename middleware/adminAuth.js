const verify = (req,res,next)=>{

    if(req.session.admin){
        next();
    }else{
        res.redirect('/admin/adlogin')
    }
}

const isLogin = (req,res,next)=>{

    if(!req.session.admin){
        next();
    }else{
        res.redirect('/admin/dashboard')
    }
}


module.exports={
    isLogin,
    verify
}
