import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Model } from 'mongoose';
import { User } from './models/users.model';
import { InjectModel } from '@nestjs/mongoose';
import { AuthService } from '../auth/auth.service';
import { SignupDto } from './dto/signup.dto';
import { SignInDto } from './dto/signin.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel('user')
    private readonly usersModel: Model<User>,
    private readonly authService: AuthService,
  ) {}

  async signUp(signupDto: SignupDto): Promise<User> {
    const user = new this.usersModel(signupDto);
    return user.save();
  }

  async signIn(
    signinDto: SignInDto,
  ): Promise<{ name: string; jwtToken: string; email: string }> {
    const user = await this.findEmail(signinDto.email);
    await this.checkPass(signinDto.password, user);
    const jwtToken = await this.authService.createAccessToken(user._id);

    return {
      name: user.name,
      jwtToken,
      email: user.email,
    };
  }

  async findAll(): Promise<User[]> {
    return this.usersModel.find();
  }

  private async findEmail(email: string): Promise<User> {
    const user = await this.usersModel.findOne({
      email,
    });
    if (!user) {
      throw new NotFoundException('User email not found');
    }

    return user;
  }

  private async checkPass(password: string, user: User): Promise<boolean> {
    const matchPass = await bcrypt.compare(password, user.password);
    if (!matchPass) {
      throw new UnauthorizedException('Password does not match');
    }

    return matchPass;
  }
}
