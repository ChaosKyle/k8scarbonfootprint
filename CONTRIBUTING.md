# Contributing to k8scarbonfootprint

We welcome contributions to the k8scarbonfootprint plugin! This guide will help you get started with contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Contributing Guidelines](#contributing-guidelines)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Testing Requirements](#testing-requirements)
- [Security Considerations](#security-considerations)
- [Documentation](#documentation)
- [Community](#community)

## Code of Conduct

This project adheres to a code of conduct that we expect all contributors to follow. Please read our [Code of Conduct](CODE_OF_CONDUCT.md) before contributing.

## Getting Started

### Prerequisites

- Node.js 18.x or later
- Go 1.21 or later
- Docker (for testing)
- kubectl (for Kubernetes integration testing)
- Git

### Development Environment Setup

1. **Fork and clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/k8scarbonfootprint.git
   cd k8scarbonfootprint
   ```

2. **Install dependencies**
   ```bash
   npm install
   go mod download
   ```

3. **Build the plugin**
   ```bash
   npm run build
   ```

4. **Run tests**
   ```bash
   npm test
   go test ./...
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

## Contributing Guidelines

### Types of Contributions

We welcome the following types of contributions:

1. **Bug Reports** - Help us identify and fix issues
2. **Feature Requests** - Suggest new functionality
3. **Code Contributions** - Implement bug fixes or new features
4. **Documentation** - Improve or expand documentation
5. **Testing** - Add test coverage or improve existing tests
6. **Performance Improvements** - Optimize code for better performance
7. **Security Enhancements** - Improve security aspects of the plugin

### Before You Start

1. **Check existing issues** - Look for existing issues or feature requests
2. **Create an issue** - If your contribution is significant, create an issue first to discuss it
3. **Follow the roadmap** - Check our roadmap to see planned features
4. **Consider the scope** - Keep contributions focused and manageable

### Branch Naming Convention

Use descriptive branch names that indicate the type and scope of your changes:

- `feat/add-oracle-cloud-support` - New features
- `fix/memory-leak-in-calculator` - Bug fixes
- `docs/update-installation-guide` - Documentation updates
- `test/add-integration-tests` - Testing improvements
- `refactor/simplify-api-client` - Code refactoring
- `security/fix-xss-vulnerability` - Security fixes

## Pull Request Process

### 1. Preparation

- [ ] Fork the repository
- [ ] Create a feature branch from `main`
- [ ] Make your changes
- [ ] Add or update tests
- [ ] Update documentation if needed
- [ ] Run the full test suite
- [ ] Run security scans

### 2. Pull Request Checklist

- [ ] **Title**: Use a clear, descriptive title
- [ ] **Description**: Provide a detailed description of changes
- [ ] **Issue Reference**: Link to related issues
- [ ] **Breaking Changes**: Clearly mark any breaking changes
- [ ] **Testing**: Describe how you tested your changes
- [ ] **Screenshots**: Include screenshots for UI changes
- [ ] **Documentation**: Update relevant documentation

### 3. Pull Request Template

```markdown
## Description
Brief description of the changes made.

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update
- [ ] Performance improvement
- [ ] Security enhancement

## How Has This Been Tested?
Describe the tests that you ran to verify your changes.

## Checklist:
- [ ] My code follows the style guidelines of this project
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes
- [ ] Any dependent changes have been merged and published
```

### 4. Review Process

1. **Automated Checks** - CI/CD pipeline must pass
2. **Code Review** - At least one maintainer review required
3. **Security Review** - Security-sensitive changes require additional review
4. **Documentation Review** - Documentation changes reviewed by docs team
5. **Final Approval** - Maintainer approval required for merge

## Coding Standards

### TypeScript/JavaScript

We use ESLint and Prettier for code formatting and linting.

```javascript
// Good
const calculateCarbonFootprint = (energyKWh: number, gridIntensity: number): number => {
  if (energyKWh < 0 || gridIntensity < 0) {
    throw new Error('Energy and grid intensity must be non-negative');
  }
  return energyKWh * gridIntensity;
};

// Bad
function calcCarbon(e, g) {
  return e * g;
}
```

### Go

Follow standard Go conventions and use `gofmt` for formatting.

```go
// Good
func CalculateCarbonFootprint(energyKWh, gridIntensity float64) (float64, error) {
    if energyKWh < 0 || gridIntensity < 0 {
        return 0, fmt.Errorf("energy and grid intensity must be non-negative")
    }
    return energyKWh * gridIntensity, nil
}

// Bad
func calcCarbon(e, g float64) float64 {
    return e * g
}
```

### Code Style Guidelines

1. **Use meaningful names** for variables, functions, and classes
2. **Write self-documenting code** with clear logic flow
3. **Add comments** for complex algorithms or business logic
4. **Handle errors gracefully** with appropriate error messages
5. **Follow SOLID principles** for object-oriented design
6. **Use dependency injection** for testability
7. **Optimize for readability** over cleverness

### Security Guidelines

1. **Input validation** - Validate all user inputs
2. **Output encoding** - Encode outputs to prevent XSS
3. **Authentication** - Verify user identity before processing requests
4. **Authorization** - Check permissions before accessing resources
5. **Secrets management** - Never hardcode secrets or credentials
6. **Error handling** - Don't expose sensitive information in error messages
7. **Logging** - Log security events appropriately

## Testing Requirements

### Test Coverage

- **Minimum 80% code coverage** for all new code
- **100% coverage** for security-critical functions
- **Integration tests** for API endpoints
- **End-to-end tests** for critical user workflows

### Testing Guidelines

1. **Unit Tests**
   ```typescript
   describe('CarbonCalculator', () => {
     it('should calculate carbon footprint correctly', () => {
       const result = calculateCarbonFootprint(1.5, 400);
       expect(result).toBe(600);
     });

     it('should handle invalid inputs', () => {
       expect(() => calculateCarbonFootprint(-1, 400)).toThrow();
     });
   });
   ```

2. **Integration Tests**
   ```go
   func TestCarbonDataSourceIntegration(t *testing.T) {
       ctx := context.Background()
       ds := NewCarbonDataSource(testConfig)
       
       query := &Query{ResourceType: "cluster"}
       result, err := ds.QueryData(ctx, query)
       
       assert.NoError(t, err)
       assert.NotEmpty(t, result.Data)
   }
   ```

3. **Security Tests**
   ```typescript
   it('should prevent XSS attacks', () => {
     const maliciousInput = '<script>alert("xss")</script>';
     const sanitized = sanitizeInput(maliciousInput);
     expect(sanitized).not.toContain('<script>');
   });
   ```

### Running Tests

```bash
# Frontend tests
npm test

# Backend tests
go test ./...

# Integration tests
npm run test:integration

# Security tests
npm run test:security

# Coverage report
npm run test:coverage
```

## Security Considerations

### Security Review Process

All contributions undergo security review:

1. **Automated security scanning** in CI/CD pipeline
2. **Manual security review** for sensitive changes
3. **Penetration testing** for major features
4. **Third-party security audit** for releases

### Security Best Practices

1. **Follow OWASP guidelines** for web application security
2. **Use parameterized queries** to prevent SQL injection
3. **Implement proper authentication** and authorization
4. **Validate all inputs** on both client and server side
5. **Use HTTPS** for all communications
6. **Store secrets securely** using proper secret management
7. **Log security events** for monitoring and alerting

### Reporting Security Vulnerabilities

If you discover a security vulnerability, please:

1. **Do not** open a public issue
2. **Email** security@k8scarbonfootprint.com with details
3. **Provide** steps to reproduce the issue
4. **Allow** reasonable time for response and fix
5. **Coordinate** disclosure timeline with maintainers

## Documentation

### Documentation Standards

1. **README files** - Keep README files up to date
2. **API documentation** - Document all public APIs
3. **Architecture docs** - Maintain architecture documentation
4. **User guides** - Provide clear user instructions
5. **Developer docs** - Help other developers contribute

### Documentation Guidelines

1. **Use clear, concise language**
2. **Provide examples** for complex concepts
3. **Include screenshots** for UI features
4. **Keep documentation current** with code changes
5. **Use proper Markdown formatting**

### Types of Documentation

- **User Documentation** - Installation, configuration, usage guides
- **Developer Documentation** - API references, architecture guides
- **Contributing Documentation** - This guide and related materials
- **Security Documentation** - Security practices and procedures

## Performance Considerations

### Performance Guidelines

1. **Optimize algorithms** for efficiency
2. **Use caching** appropriately to reduce API calls
3. **Implement pagination** for large datasets
4. **Monitor resource usage** and optimize accordingly
5. **Use efficient data structures** for the use case

### Carbon Efficiency

Since this plugin monitors carbon footprint, we prioritize carbon-efficient code:

1. **Minimize CPU usage** through efficient algorithms
2. **Reduce memory allocation** where possible
3. **Optimize network calls** to reduce data transfer
4. **Use lazy loading** to avoid unnecessary computations
5. **Implement smart caching** to reduce redundant operations

## Community

### Communication Channels

- **GitHub Issues** - Bug reports and feature requests
- **GitHub Discussions** - General questions and discussions
- **Documentation** - Comprehensive guides and references

### Getting Help

1. **Check documentation** first for answers
2. **Search existing issues** for similar problems
3. **Create an issue** with detailed information
4. **Join discussions** to engage with the community
5. **Follow the project** for updates and announcements

### Recognition

We recognize contributors through:

- **Contributor list** in README
- **Release notes** acknowledging contributions
- **Special recognition** for significant contributions
- **Maintainer status** for consistent, high-quality contributions

## Release Process

### Version Management

We follow [Semantic Versioning](https://semver.org/):

- **MAJOR.MINOR.PATCH** (e.g., 1.2.3)
- **MAJOR** - Breaking changes
- **MINOR** - New features (backward compatible)
- **PATCH** - Bug fixes (backward compatible)

### Release Schedule

- **Major releases** - Quarterly
- **Minor releases** - Monthly
- **Patch releases** - As needed for critical fixes

### Release Checklist

- [ ] All tests pass
- [ ] Security scans pass
- [ ] Documentation updated
- [ ] Changelog updated
- [ ] Version bumped
- [ ] Release notes prepared
- [ ] Signed plugin package created

Thank you for contributing to k8scarbonfootprint! Your contributions help make Kubernetes more sustainable for everyone.