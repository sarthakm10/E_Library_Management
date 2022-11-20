<%@ Page Title="" Language="C#" MasterPageFile="~/Site1.Master" AutoEventWireup="true" CodeBehind="usersignup.aspx.cs" Inherits="E_Library_Management.usersignup" %>
<asp:Content ID="Content1" ContentPlaceHolderID="head" runat="server">
</asp:Content>
<asp:Content ID="Content2" ContentPlaceHolderID="ContentPlaceHolder1" runat="server">
</asp:Content>
<asp:Content ID="Content3" ContentPlaceHolderID="ContentPlaceHolder2" runat="server">
    <div class="container">
      <div class="row">
         <div class="col-md-8 mx-auto">
            <div class="card">
               <div class="card-body">
                  <div class="row">
                     <div class="col">
                        <center>
                           <img width="100px" src="imgs/generaluser.png"/>
                        </center>
                     </div>
                  </div>
                  <div class="row">
                     <div class="col">
                        <center>
                           <h4>Member Sign Up</h4>
                        </center>
                     </div>
                  </div>
                  <div class="row">
                     <div class="col">
                        <hr>
                     </div>
                  </div>
                    <div class="row">
                     <div class="col-md-6">
                        <label>Full Name</label>
                        <div class="form-group">
                           <asp:TextBox CssClass="form-control w-100" ID="TextBox1" runat="server" placeholder="Full Name"></asp:TextBox>
                        </div>
                     </div>
                     <div class="col-md-6">
                        <label>Date of Birth</label>
                        <div class="form-group">
                           <asp:TextBox CssClass="form-control w-100" ID="TextBox2" runat="server" placeholder="DateofBirth" TextMode="Date"></asp:TextBox>
                        </div>
                     </div>
                  </div>
                   <div>
                       <br />
                   </div>
                   <div class="row">
                     <div class="col-md-6">
                        <label>Contact Number</label>
                        <div class="form-group">
                           <asp:TextBox CssClass="form-control w-100" ID="TextBox3" runat="server" placeholder="Contact Number" TextMode="Number"></asp:TextBox>
                        </div>
                     </div>
                     <div class="col-md-6">
                        <label>Email Id</label>
                        <div class="form-group">
                           <asp:TextBox CssClass="form-control w-100" ID="TextBox4" runat="server" placeholder="Email ID" TextMode="Email"></asp:TextBox>
                        </div>
                     </div>
                  </div>
                   <div>
                       <br />
                   </div>
                   <div class="row">
                     <div class="col-md-4">
                        <label>State</label>
                        <div class="form-group">
                            <asp:DropDownList Class="form-control w-100" ID="DropDownList1" runat="server">
                                <asp:ListItem Text="Select" Value="select"></asp:ListItem>
                                <asp:ListItem Value="Andhra Pradesh" Text="Andhra Pradesh"></asp:ListItem>
                                <asp:ListItem Value="Arunachal Pradesh" Text="Arunachal Pradesh"></asp:ListItem>
                                <asp:ListItem Value="Assam" Text="Assam"></asp:ListItem>
                                <asp:ListItem Value="Bihar" Text="Bihar"></asp:ListItem>
                                <asp:ListItem Value="Chhattisgarh" Text="Chhattisgarh"></asp:ListItem>
                                <asp:ListItem Value="Goa" Text="Goa"></asp:ListItem>
                                <asp:ListItem Value="Gujarat" Text="Gujarat"></asp:ListItem>
                                <asp:ListItem Value="Haryana" Text="Haryana"></asp:ListItem>
                                <asp:ListItem Value="Himachal Pradesh" Himachal PradeshText=""></asp:ListItem>
                                <asp:ListItem Value="Jharkhand" Text="Jharkhand"></asp:ListItem>
                                <asp:ListItem Value="Karnataka" Text="Karnataka"></asp:ListItem>
                                <asp:ListItem Value="Kerala" Text="Kerala"></asp:ListItem>
                                <asp:ListItem Value="Madhya Pradesh" Text="Madhya Pradesh"></asp:ListItem>
                                <asp:ListItem Value="Maharashtra" Text="Maharashtra"></asp:ListItem>
                                <asp:ListItem Value="Manipur" Text="Manipur"></asp:ListItem>
                                <asp:ListItem Value="Meghalaya" Text="Meghalaya"></asp:ListItem>
                                <asp:ListItem Value="Mizoram" Text="Mizoram"></asp:ListItem>
                                <asp:ListItem Value="Nagaland" Text="Nagaland"></asp:ListItem>
                                <asp:ListItem Value="Odisha" Text="Odisha"></asp:ListItem>
                                <asp:ListItem Value="Punjab" Text="Punjab"></asp:ListItem>
                                <asp:ListItem Value="Rajasthan" Text="Rajasthan"></asp:ListItem>
                                <asp:ListItem Value="Sikkim" Text="Sikkim"></asp:ListItem>
                                <asp:ListItem Value="Tamil Nadu" Text="Tamil Nadu"></asp:ListItem>
                                <asp:ListItem Value="Telangana" Text="Telangana"></asp:ListItem>
                                <asp:ListItem Value="Tripura" Text="Tripura"></asp:ListItem>
                                <asp:ListItem Value="Uttar Pradesh" Text="Uttar Pradesh"></asp:ListItem>
                                <asp:ListItem Value="Uttarakhand" Text="Uttarakhand"></asp:ListItem>
                                <asp:ListItem Value="West Bengal" Text="West Bengal"></asp:ListItem>
                            </asp:DropDownList>
                        </div>
                     </div>
                     <div class="col-md-4">
                        <label>City</label>
                        <div class="form-group">
                           <asp:TextBox CssClass="form-control w-100" ID="TextBox7" runat="server" placeholder="City"></asp:TextBox>
                        </div>
                     </div>
                     <div class="col-md-4">
                        <label>Pin Code</label>
                        <div class="form-group">
                           <asp:TextBox CssClass="form-control w-100" ID="TextBox6" runat="server" placeholder="Pin Code" TextMode="Number"></asp:TextBox>
                        </div>
                     </div>
                  </div>
                   <div>
                       <br />
                   </div>
                  <div class="row">
                     <div class="col">
                        <label>Full Address</label>
                        <div class="form-group">
                           <asp:TextBox CssClass="form-control w-100" ID="TextBox5" runat="server" placeholder="Full Address" TextMode="MultiLine"></asp:TextBox>
                        </div>
                     </div>
                  </div>

                   <div>
                       <br />
                   </div>
                   <div class="row">
                     <div class="col-md-6">
                        <label>User ID </label>
                        <div class="form-group">
                           <asp:TextBox CssClass="form-control w-100" ID="TextBox8" runat="server" placeholder="User ID"></asp:TextBox>
                        </div>
                     </div>
                     <div class="col-md-6">
                        <label>Password</label>
                        <div class="form-group">
                           <asp:TextBox CssClass="form-control w-100" ID="TextBox9" runat="server" placeholder="Password" TextMode="Password"></asp:TextBox>
                        </div>
                     </div>
                  </div>
                        
                         <div>
                             <br />
                         </div>
                        <div class="form-group">
                           <asp:Button class="btn btn-success w-100 btn-sm" ID="Button1" runat="server" Text="Sign Up" OnClick="Button1_Click"/>
                        </div> 
                     </div>
                  </div>
               </div>
            </div>
            <a href="homepage.aspx"><< Back to Home</a><br><br>
         </div>
      </div>
   </div>
</asp:Content>
