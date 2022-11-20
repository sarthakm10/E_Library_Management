<%@ Page Title="" Language="C#" MasterPageFile="~/Site1.Master" AutoEventWireup="true" CodeBehind="userprofile.aspx.cs" Inherits="E_Library_Management.userprofile" %>
<asp:Content ID="Content1" ContentPlaceHolderID="head" runat="server">
</asp:Content>
<asp:Content ID="Content2" ContentPlaceHolderID="ContentPlaceHolder1" runat="server">
</asp:Content>
<asp:Content ID="Content3" ContentPlaceHolderID="ContentPlaceHolder2" runat="server">
    <div class="container-fluid">
      <div class="row">
         <div class="col-md-5">
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
                           <h4>Your Profile</h4>
                           <span>Account Status - </span>
                           <asp:Label class="badge badge-pill badge-info" ID="Label1" runat="server" Text="Your status"></asp:Label>
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
                                <asp:ListItem Value="Select" Text="Andhra Pradesh"></asp:ListItem>
                                <asp:ListItem Value="Select" Text="Arunachal Pradesh"></asp:ListItem>
                                <asp:ListItem Value="Select" Text="Assam"></asp:ListItem>
                                <asp:ListItem Value="Select" Text="Bihar"></asp:ListItem>
                                <asp:ListItem Value="Select" Text="Chhattisgarh"></asp:ListItem>
                                <asp:ListItem Value="Select" Text="Goa"></asp:ListItem>
                                <asp:ListItem Value="Select" Text="Gujarat"></asp:ListItem>
                                <asp:ListItem Value="Select" Text="Haryana"></asp:ListItem>
                                <asp:ListItem Value="Select" Text="Himachal Pradesh"></asp:ListItem>
                                <asp:ListItem Value="Select" Text="Jharkhand"></asp:ListItem>
                                <asp:ListItem Value="Select" Text="Karnataka"></asp:ListItem>
                                <asp:ListItem Value="Select" Text="Kerala"></asp:ListItem>
                                <asp:ListItem Value="Select" Text="Madhya Pradesh"></asp:ListItem>
                                <asp:ListItem Value="Select" Text="Maharashtra"></asp:ListItem>
                                <asp:ListItem Value="Select" Text="Manipur"></asp:ListItem>
                                <asp:ListItem Value="Select" Text="Meghalaya"></asp:ListItem>
                                <asp:ListItem Value="Select" Text="Mizoram"></asp:ListItem>
                                <asp:ListItem Value="Select" Text="Nagaland"></asp:ListItem>
                                <asp:ListItem Value="Select" Text="Odisha"></asp:ListItem>
                                <asp:ListItem Value="Select" Text="Punjab"></asp:ListItem>
                                <asp:ListItem Value="Select" Text="Rajasthan"></asp:ListItem>
                                <asp:ListItem Value="Select" Text="Sikkim"></asp:ListItem>
                                <asp:ListItem Value="Select" Text="Tamil Nadu"></asp:ListItem>
                                <asp:ListItem Value="Select" Text="Telangana"></asp:ListItem>
                                <asp:ListItem Value="Select" Text="Tripura"></asp:ListItem>
                                <asp:ListItem Value="Select" Text="Uttar Pradesh"></asp:ListItem>
                                <asp:ListItem Value="Select" Text="Uttarakhand"></asp:ListItem>
                                <asp:ListItem Value="Select" Text="West Bengal"></asp:ListItem>
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
                        <label>Address</label>
                        <div class="form-group">
                           <asp:TextBox CssClass="form-control w-100" ID="TextBox5" runat="server" placeholder="Address" TextMode="MultiLine"></asp:TextBox>
                        </div>
                     </div>
                  </div>

                   <div>
                       <br />
                   </div>

                  <div class="row">
                     <div class="col-md-4">
                        <label>User ID</label>
                        <div class="form-group">
                           <asp:TextBox class="form-control w-100" ID="TextBox8" runat="server" placeholder="User ID" ReadOnly="True"></asp:TextBox>
                        </div>
                     </div>
                     <div class="col-md-4">
                        <label>Old Password</label>
                        <div class="form-group">
                           <asp:TextBox class="form-control w-100" ID="TextBox9" runat="server" placeholder="Email ID" TextMode="Password" ReadOnly="True"></asp:TextBox>
                        </div>
                     </div>
                     <div class="col-md-4">
                        <label>New Password</label>
                        <div class="form-group">
                           <asp:TextBox class="form-control w-100" ID="TextBox10" runat="server" placeholder="New Password" TextMode="Password"></asp:TextBox>
                        </div>
                     </div>
                  </div>
                   <div>
                       <br />
                   </div>
                  <div class="row">
                     <div class="col-8 mx-auto">
                        <center>
                           <div class="form-group">
                              <asp:Button class="btn btn-primary w-100 btn-sm" ID="Button1" runat="server" Text="Update" OnClick="Button1_Click" />
                           </div>
                        </center>
                     </div>
                  </div>
               </div>
            </div>
            <a href="homepage.aspx"><< Back to Home</a><br><br>
         </div>
         <div class="col-md-7">
            <div class="card">
               <div class="card-body">
                  <div class="row">
                     <div class="col">
                        <center>
                           <img width="100px" src="imgs/books1.png"/>
                        </center>
                     </div>
                  </div>
                  <div class="row">
                     <div class="col">
                        <center>
                           <h4>Your Issued Books</h4>
                           <asp:Label class="badge badge-pill badge-info" ID="Label2" runat="server" Text="your books info"></asp:Label>
                        </center>
                     </div>
                  </div>
                  <div class="row">
                     <div class="col">
                        <hr>
                     </div>
                  </div>
                  <div class="row">
                      
                     <div class="col">
                        <asp:GridView class="table table-striped table-bordered" ID="GridView1" runat="server" OnRowDataBound="GridView1_RowDataBound1"></asp:GridView>
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </div>
   </div>
</asp:Content>
